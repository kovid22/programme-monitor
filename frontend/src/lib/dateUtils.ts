import type { Activity } from "../data/types";
import { isEffectivelyAtRisk } from "./statusUtils";

export interface HoverData {
  total: number;
  risk: number;
  normal: number;
  completed: number;
  val: number;
  agencies: string;
  titles: string[];
  more: number;
}

export interface DayData {
  empty: boolean;
  dStr: string;
  dayNum?: number;
}

export interface MonthData {
  label: string;
  days: DayData[];
}

export interface CalendarData {
  monthsData: MonthData[];
  summary: {
    deadlines: number;
    peak: string;
    atRisk: number;
  };
  tbcCount: number;
  hoverDataMap: Map<string, HoverData>;
  maxDailyActivities: number;
  todayStr: string;
  availableMonths: string[];
  currentWindowStart: string;
}

export function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseLocalDate(dStr: string): Date {
  const [y, m, d] = dStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function calculateCalendarData(activities: Activity[], overrideStartMonth?: string): CalendarData {
  const today = new Date();
  const todayStr = toLocalDateString(today);
  const currentMonthStr = todayStr.substring(0, 7);
  
  // Separate dated and TBC
  const dated = activities.filter(a => a.targetDate && a.targetDate.trim() !== "");
  const tbcCount = activities.length - dated.length;

  let atRiskCount = 0;
  const dateMap = new Map<string, Activity[]>();
  const monthCounts = new Map<string, number>();
  
  dated.forEach(a => {
    if (isEffectivelyAtRisk(a)) {
      atRiskCount++;
    }
    const dStr = a.targetDate!;
    if (!dateMap.has(dStr)) dateMap.set(dStr, []);
    dateMap.get(dStr)!.push(a);

    const mStr = dStr.substring(0, 7); // YYYY-MM
    monthCounts.set(mStr, (monthCounts.get(mStr) || 0) + 1);
  });

  // Generate contiguous months range from 2015-01 to 2040-12
  const allMonthsContiguous: string[] = [];
  for (let y = 2015; y <= 2040; y++) {
    for (let m = 1; m <= 12; m++) {
      allMonthsContiguous.push(`${y}-${String(m).padStart(2, '0')}`);
    }
  }

  // Determine window start
  let windowStart = currentMonthStr; // Always default to current month
  if (overrideStartMonth && allMonthsContiguous.includes(overrideStartMonth)) {
    windowStart = overrideStartMonth;
  } else {
    const idx = allMonthsContiguous.indexOf(currentMonthStr);
    if (idx > allMonthsContiguous.length - 3) {
      windowStart = allMonthsContiguous[allMonthsContiguous.length - 3];
    }
  }

  const startIdx = allMonthsContiguous.indexOf(windowStart);
  const windowMonths = allMonthsContiguous.slice(startIdx, startIdx + 3);

  let maxDaily = 0;
  const hoverDataMap = new Map<string, HoverData>();
  
  for (const [dStr, acts] of dateMap.entries()) {
    if (acts.length > maxDaily) maxDaily = acts.length;
    
    const completed = acts.filter(a => a.completionStatus === "Completed").length;
    const risk = acts.filter(a => isEffectivelyAtRisk(a)).length;
    const normal = acts.length - completed - risk;
    
    const val = acts.reduce((acc, a) => acc + (a.estValue || 0), 0);
    const agencies = Array.from(new Set(acts.map(a => a.agency))).join(", ");
    
    hoverDataMap.set(dStr, {
      total: acts.length,
      risk,
      normal,
      completed,
      val,
      agencies,
      titles: acts.map(a => a.title).slice(0, 5),
      more: acts.length > 5 ? acts.length - 5 : 0
    });
  }

  let peakWeekStr = "";
  if (dated.length > 0) {
    const allDates = Array.from(dateMap.keys()).sort();
    let maxWeekCount = 0;
    let bestWeekStart = allDates[0];
    
    for (const startStr of allDates) {
      const start = parseLocalDate(startStr);
      const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
      let count = 0;
      dateMap.forEach((acts, dStr) => {
        const d = parseLocalDate(dStr);
        if (d >= start && d <= end) count += acts.length;
      });
      if (count > maxWeekCount) {
        maxWeekCount = count;
        bestWeekStart = startStr;
      }
    }
    
    const start = parseLocalDate(bestWeekStart);
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 4);
    peakWeekStr = `Peak week: ${start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}–${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
  }

  const monthsData = windowMonths.map(mStr => {
    const [yStr, monthStr] = mStr.split('-');
    const year = parseInt(yStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const date = new Date(year, month, 1);
    const monthLabel = date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }).toUpperCase();
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayWeekday = date.getDay();
    
    let padDays = firstDayWeekday - 1;
    if (padDays < 0) padDays = 6;
    
    const days: DayData[] = [];
    for (let i = 0; i < padDays; i++) {
      days.push({ empty: true, dStr: "" });
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ empty: false, dStr, dayNum: d });
    }
    
    return { label: monthLabel, days };
  });

  return {
    monthsData,
    summary: {
      deadlines: dated.length,
      peak: peakWeekStr,
      atRisk: atRiskCount
    },
    tbcCount,
    hoverDataMap,
    maxDailyActivities: maxDaily,
    todayStr,
    availableMonths: allMonthsContiguous,
    currentWindowStart: windowStart
  };
}