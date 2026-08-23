import { useMemo, useState, useRef, useEffect } from "react";
import { cn } from "../../../lib/utils";
import type { Activity } from "../../../data/types";
import { calculateCalendarData, parseLocalDate } from "../../../lib/dateUtils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrencyValue } from "../../../lib/utils";

interface DeliveryCalendarProps {
  activities: Activity[];
}

export function DeliveryCalendar({ activities }: DeliveryCalendarProps) {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [windowStart, setWindowStart] = useState<string | undefined>(undefined);

  const {
    monthsData,
    summary,
    hoverDataMap,
    maxDailyActivities,
    todayStr,
    availableMonths,
    currentWindowStart
  } = useMemo(() => {
    return calculateCalendarData(activities, windowStart);
  }, [activities, windowStart]);

  const triggerElRef = useRef<HTMLElement | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updatePopupPosition = () => {
    if (!popupRef.current || !triggerElRef.current) return;
    const el = popupRef.current;
    const triggerRect = triggerElRef.current.getBoundingClientRect();
    
    const width = el.offsetWidth || 256; // fallback for w-64
    const height = el.offsetHeight || 150;
    
    const gap = 10;
    let left = triggerRect.right + gap;
    let top = triggerRect.top;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Flip left if overflowing right
    if (left + width > vw - 16) {
      left = triggerRect.left - width - gap;
      if (left < 16) left = 16; // final safety clamp
    }

    // Clamp vertically
    if (top + height > vh - 16) {
      top = vh - height - 16;
    }
    if (top < 16) {
      top = 16;
    }

    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    el.style.visibility = 'visible';
  };

  useEffect(() => {
    if (hoveredDate) {
      updatePopupPosition();
      requestAnimationFrame(updatePopupPosition);
    }
  }, [hoveredDate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && hoveredDate) {
        setHoveredDate(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hoveredDate]);

  const handleMouseEnter = (e: React.MouseEvent, dStr: string) => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    triggerElRef.current = e.currentTarget as HTMLElement;
    setHoveredDate(dStr);
  };

  const handleMouseLeave = () => {
    hideTimeout.current = setTimeout(() => {
      setHoveredDate(null);
    }, 120);
  };

  const handlePopupMouseEnter = () => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
  };

  const handlePopupMouseLeave = () => {
    hideTimeout.current = setTimeout(() => {
      setHoveredDate(null);
    }, 120);
  };

  const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const currIdx = availableMonths.indexOf(currentWindowStart);
  const canGoBack = currIdx > 0;
  const canGoForward = currIdx + 3 < availableMonths.length;

  const handlePrev = () => {
    if (canGoBack) setWindowStart(availableMonths[Math.max(0, currIdx - 3)]);
  };

  const handleNext = () => {
    if (canGoForward) setWindowStart(availableMonths[Math.min(availableMonths.length - 3, currIdx + 3)]);
  };

  let rangeLabel = "";
  if (currentWindowStart) {
    const startD = parseLocalDate(currentWindowStart + "-01");
    const endD = new Date(startD.getFullYear(), startD.getMonth() + 2, 1);
    const startMonth = startD.toLocaleDateString('en-GB', { month: 'short' });
    const startYear = startD.getFullYear();
    const endMonth = endD.toLocaleDateString('en-GB', { month: 'short' });
    const endYear = endD.getFullYear();
    
    rangeLabel = startYear === endYear 
      ? `${startMonth}–${endMonth} ${startYear}` 
      : `${startMonth} ${startYear}–${endMonth} ${endYear}`;
  }

  return (
    <div className="w-full h-full min-h-[240px] bg-surface rounded-[20px] p-4 lg:p-5 flex flex-col relative overflow-hidden shadow-sm border border-subtle">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4 z-10">
        <div>
          <h3 className="text-base font-semibold text-primary mb-1">Delivery Calendar</h3>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted font-normal">
            <span>{summary.deadlines} {summary.deadlines === 1 ? 'deadline' : 'deadlines'}</span>
            {summary.peak && (
              <span>{summary.peak}</span>
            )}
          </div>
        </div>
        
        {availableMonths.length > 3 && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrev}
              disabled={!canGoBack}
              className="p-1.5 rounded-lg border border-subtle bg-canvas hover:bg-elevated disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-primary"
              aria-label="Previous 3 months"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-medium text-primary w-[90px] text-center whitespace-nowrap tracking-wide">
              {rangeLabel}
            </span>
            <button
              onClick={handleNext}
              disabled={!canGoForward}
              className="p-1.5 rounded-lg border border-subtle bg-canvas hover:bg-elevated disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-primary"
              aria-label="Next 3 months"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* 3-Month Strip */}
      <div className="flex-1 flex flex-col min-h-0 relative pb-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full items-start">
          {monthsData.map((month, mIndex) => (
            <div key={mIndex} className="flex flex-col">
              <h4 className="text-xs font-semibold text-primary mb-3 text-center tracking-wider">{month.label}</h4>
              
              <div className="grid grid-cols-7 gap-1 mb-1.5">
                {weekdays.map((day, i) => (
                  <div key={i} className={`text-center text-[11px] font-semibold tracking-wider uppercase ${i === 6 ? 'text-red-600 dark:text-muted' : 'text-primary dark:text-muted'}`}>
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {month.days.map((dayObj, dIndex) => {
                  if (dayObj.empty) {
                    return <div key={`empty-${dIndex}`} className="aspect-square opacity-0"></div>;
                  }

                  const dStr = dayObj.dStr;
                  const isToday = dStr === todayStr;
                  const data = hoverDataMap.get(dStr);
                  
                  let intensityClass = "bg-canvas border border-transparent";
                  
                  if (data) {
                    const ratio = data.total / (maxDailyActivities || 1);
                    
                    let colorKey = 'completed';
                    if (data.risk > 0) colorKey = 'risk';
                    else if (data.normal > 0) colorKey = 'normal';
                    
                    if (colorKey === 'risk') {
                      if (ratio <= 0.25) intensityClass = `bg-state-risk/30 text-white dark:text-state-risk`;
                      else if (ratio <= 0.5) intensityClass = `bg-state-risk/50 text-white dark:text-state-risk`;
                      else if (ratio <= 0.75) intensityClass = `bg-state-risk/75 text-white dark:text-state-risk`;
                      else intensityClass = `bg-state-risk text-white dark:text-primary`;
                    } else if (colorKey === 'normal') {
                      if (ratio <= 0.25) intensityClass = `bg-state-scheduled/30 text-white dark:text-state-scheduled`;
                      else if (ratio <= 0.5) intensityClass = `bg-state-scheduled/50 text-white dark:text-state-scheduled`;
                      else if (ratio <= 0.75) intensityClass = `bg-state-scheduled/75 text-white dark:text-state-scheduled`;
                      else intensityClass = `bg-state-scheduled text-white dark:text-primary`;
                    } else {
                      if (ratio <= 0.25) intensityClass = `bg-state-completed/30 text-white dark:text-state-completed`;
                      else if (ratio <= 0.5) intensityClass = `bg-state-completed/50 text-white dark:text-state-completed`;
                      else if (ratio <= 0.75) intensityClass = `bg-state-completed/75 text-white dark:text-state-completed`;
                      else intensityClass = `bg-state-completed text-white dark:text-primary`;
                    }
                  }

                  if (isToday) {
                    if (data) {
                      intensityClass += " ring-[2px] ring-[#0084FF] ring-offset-2 ring-offset-surface";
                    } else {
                      intensityClass = "bg-[#0084FF] text-white shadow-sm z-10";
                    }
                  }

                  if (data) {
                    return (
                      <button
                        type="button"
                        key={dStr}
                        className={cn(
                          "relative aspect-square rounded-sm flex items-center justify-center transition-all duration-200",
                          "cursor-pointer hover:opacity-80 shadow-sm z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-surface",
                          intensityClass
                        )}
                        onMouseEnter={(e) => handleMouseEnter(e, dStr)}
                        onMouseLeave={handleMouseLeave}
                        onFocus={(e) => {
                          triggerElRef.current = e.currentTarget as HTMLElement;
                          setHoveredDate(dStr);
                        }}
                        onBlur={() => setHoveredDate(null)}
                      >
                        <span className="text-[11px] font-medium leading-none">
                          {dayObj.dayNum}
                        </span>
                      </button>
                    );
                  }

                  return (
                    <div
                      key={dStr}
                      className={cn(
                        "relative aspect-square rounded-sm flex items-center justify-center transition-all duration-200",
                        intensityClass,
                        !isToday && "text-secondary/50"
                      )}
                    >
                      <span className="text-[11px] font-medium leading-none">
                        {dayObj.dayNum}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-5 pt-2 mt-1 text-xs text-secondary font-medium">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[2px] bg-state-completed"></span>
          Completed
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[2px] bg-state-risk"></span>
          Overdue / Immediate
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[2px] bg-state-scheduled"></span>
          Due Soon / On Track
        </div>
      </div>

      {hoveredDate && hoverDataMap.has(hoveredDate) && (
        <div 
          ref={popupRef}
          className="fixed p-3.5 bg-canvas border border-subtle rounded-xl shadow-md z-[100] w-64 animate-in fade-in slide-in-from-bottom-[2px] duration-150 ease-out"
          style={{ visibility: 'hidden' }}
          onMouseEnter={handlePopupMouseEnter}
          onMouseLeave={handlePopupMouseLeave}
        >
          <p className="text-sm font-semibold text-primary mb-2.5">
            {parseLocalDate(hoveredDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
          </p>
          
          <div className="grid grid-cols-2 gap-y-2 gap-x-3 mb-2.5">
            <div>
              <p className="text-xs text-muted mb-0.5">Due</p>
              <p className="text-xs font-medium text-primary">{hoverDataMap.get(hoveredDate)!.total}</p>
            </div>
            <div>
              <p className="text-xs text-muted mb-0.5">At Risk</p>
              <p className={cn("text-xs font-medium", hoverDataMap.get(hoveredDate)!.risk > 0 ? "text-danger" : "text-primary")}>
                {hoverDataMap.get(hoveredDate)!.risk}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted mb-0.5">Est. Value</p>
              <p className="text-xs font-medium text-primary">{formatCurrencyValue(hoverDataMap.get(hoveredDate)!.val)}</p>
            </div>
            <div>
              <p className="text-xs text-muted mb-0.5">Agencies</p>
              <p className="text-xs font-medium text-primary truncate">{hoverDataMap.get(hoveredDate)!.agencies}</p>
            </div>
          </div>
          
          <div className="pt-2 mt-1">
            <p className="text-xs text-muted mb-1.5">Activities</p>
            <div className="flex flex-col gap-1">
              {hoverDataMap.get(hoveredDate)!.titles.map((t: string, i: number) => (
                <p key={i} className="text-xs text-secondary truncate">• {t}</p>
              ))}
              {hoverDataMap.get(hoveredDate)!.more > 0 && (
                <p className="text-xs text-muted italic mt-0.5">+ {hoverDataMap.get(hoveredDate)!.more} more</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
