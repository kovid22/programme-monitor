import { useMemo, useState } from "react";
import { cn } from "../../../lib/utils";
import type { Activity } from "../../../data/types";
import { calculateCalendarData, parseLocalDate } from "../../../lib/dateUtils";

interface DeliveryCalendarProps {
  activities: Activity[];
}

export function DeliveryCalendar({ activities }: DeliveryCalendarProps) {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const {
    monthsData,
    summary,
    tbcCount,
    hoverDataMap,
    maxDailyActivities,
    todayStr
  } = useMemo(() => {
    return calculateCalendarData(activities);
  }, [activities]);

  const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="w-full h-full min-h-[260px] bg-surface rounded-[24px] p-5 lg:p-6 flex flex-col relative overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5 z-10">
        <div>
          <h3 className="text-sm font-semibold text-primary mb-1">Delivery Calendar</h3>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] text-secondary font-medium">
            <span>{summary.deadlines} {summary.deadlines === 1 ? 'deadline' : 'deadlines'}</span>
            {summary.peak && (
              <>
                <span className="w-1 h-1 rounded-full bg-subtle"></span>
                <span>{summary.peak}</span>
              </>
            )}
            <span className="w-1 h-1 rounded-full bg-subtle"></span>
            <span className={summary.atRisk > 0 ? "text-danger" : ""}>{summary.atRisk} at risk</span>
            
            {tbcCount > 0 && (
              <>
                <span className="w-1 h-1 rounded-full bg-subtle"></span>
                <span className="italic">{tbcCount} TBC</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3-Month Strip */}
      <div className="flex-1 flex flex-col min-h-0 relative pb-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-start">
          {monthsData.map((month, mIndex) => (
            <div key={mIndex} className="flex flex-col">
              <h4 className="text-[10px] font-semibold text-primary mb-3 text-center tracking-wider">{month.label}</h4>
              
              <div className="grid grid-cols-7 gap-1 mb-1.5">
                {weekdays.map((day, i) => (
                  <div key={i} className="text-center text-[8px] font-semibold tracking-wider text-muted uppercase">
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
                  let borderColor = "";
                  
                  if (data) {
                    const ratio = data.total / (maxDailyActivities || 1);
                    if (ratio <= 0.25) intensityClass = "bg-data-periwinkle/30";
                    else if (ratio <= 0.5) intensityClass = "bg-data-periwinkle/50";
                    else if (ratio <= 0.75) intensityClass = "bg-data-periwinkle/75";
                    else intensityClass = "bg-data-periwinkle";
                    
                    if (data.risk > 0) borderColor += " border-b-2 border-b-danger";
                    if (data.completed > 0) borderColor += " border-t-2 border-t-data-green";
                  }

                  if (isToday) {
                    intensityClass += " ring-1 ring-primary ring-offset-1 ring-offset-surface";
                  }

                  if (data) {
                    return (
                      <button
                        type="button"
                        key={dStr}
                        className={cn(
                          "relative aspect-square rounded-sm flex items-center justify-center transition-all duration-200",
                          intensityClass,
                          borderColor,
                          "cursor-pointer hover:opacity-80 shadow-sm z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-surface"
                        )}
                        onMouseEnter={() => setHoveredDate(dStr)}
                        onMouseLeave={() => setHoveredDate(null)}
                        onFocus={() => setHoveredDate(dStr)}
                        onBlur={() => setHoveredDate(null)}
                      >
                        <span className="text-[8px] font-medium leading-none text-primary">
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
                        borderColor,
                        "text-muted/30"
                      )}
                    >
                      <span className="text-[8px] font-medium leading-none">
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

      {hoveredDate && hoverDataMap.has(hoveredDate) && (
        <div className="absolute bottom-6 left-6 p-4 bg-canvas border border-subtle rounded-xl shadow-xl z-50 w-64 pointer-events-none animate-in fade-in duration-100">
          <p className="text-xs font-semibold text-primary mb-1">
            {parseLocalDate(hoveredDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
          </p>
          
          <div className="grid grid-cols-2 gap-2 mb-3 mt-2">
            <div>
              <p className="text-[9px] uppercase tracking-wider text-muted mb-0.5">Due</p>
              <p className="text-[10px] font-medium text-primary">{hoverDataMap.get(hoveredDate)!.total} activities</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-muted mb-0.5">At Risk</p>
              <p className={cn("text-[10px] font-medium", hoverDataMap.get(hoveredDate)!.risk > 0 ? "text-danger" : "text-primary")}>
                {hoverDataMap.get(hoveredDate)!.risk}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-[9px] uppercase tracking-wider text-muted mb-0.5">Est. Value</p>
              <p className="text-[10px] font-medium text-primary">₹{hoverDataMap.get(hoveredDate)!.val.toLocaleString('en-IN')}L</p>
            </div>
            <div className="col-span-2">
              <p className="text-[9px] uppercase tracking-wider text-muted mb-0.5">Agencies</p>
              <p className="text-[10px] text-secondary truncate">{hoverDataMap.get(hoveredDate)!.agencies}</p>
            </div>
          </div>
          
          <div className="border-t border-subtle pt-2">
            <p className="text-[9px] uppercase tracking-wider text-muted mb-1">Activities</p>
            {hoverDataMap.get(hoveredDate)!.titles.map((t: string, i: number) => (
              <p key={i} className="text-[9px] text-secondary truncate mb-0.5">• {t}</p>
            ))}
            {hoverDataMap.get(hoveredDate)!.more > 0 && (
              <p className="text-[9px] text-muted italic mt-1">+ {hoverDataMap.get(hoveredDate)!.more} more</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
