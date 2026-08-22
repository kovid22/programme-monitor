import { useMemo, useState } from "react";
import { cn } from "../../../lib/utils";
import type { Activity } from "../../../data/types";
import { isEffectivelyAtRisk } from "../../../lib/statusUtils";

interface DeliveryFlowProps {
  activities: Activity[];
}

export function DeliveryFlow({ activities }: DeliveryFlowProps) {
  const [hoveredSeg, setHoveredSeg] = useState<string | null>(null);

  const { agenciesData, maxActs } = useMemo(() => {
    // 1. Group by Agency
    const agencyMap = new Map<string, Activity[]>();
    activities.forEach(a => {
      const ag = a.agency || "Unassigned";
      if (!agencyMap.has(ag)) agencyMap.set(ag, []);
      agencyMap.get(ag)!.push(a);
    });

    // 2. Process each Agency
    const data = Array.from(agencyMap.entries()).map(([agencyName, agActs]) => {
      let totalRisk = 0;
      let totalValue = 0;
      
      const compMap = new Map<string, Activity[]>();
      agActs.forEach(a => {
        if (isEffectivelyAtRisk(a)) totalRisk++;
        totalValue += (a.estValue || 0);
        
        const comp = a.component || "Unassigned";
        if (!compMap.has(comp)) compMap.set(comp, []);
        compMap.get(comp)!.push(a);
      });

      const workstreams = Array.from(compMap.entries()).map(([compName, cActs]) => {
        const completed = cActs.filter(a => a.completionStatus === "Completed").length;
        const inProgress = cActs.filter(a => a.completionStatus === "In Progress").length;
        const delayed = cActs.filter(a => a.completionStatus === "Delayed").length;
        const risk = cActs.filter(a => isEffectivelyAtRisk(a)).length;
        const value = cActs.reduce((sum, a) => sum + (a.estValue || 0), 0);
        const riskValue = cActs.filter(a => isEffectivelyAtRisk(a)).reduce((sum, a) => sum + (a.estValue || 0), 0);
        
        return {
          name: compName,
          acts: cActs.length,
          completed,
          inProgress,
          delayed,
          risk,
          value,
          riskValue,
          pctDone: Math.round((completed / cActs.length) * 100),
          titles: cActs.map(a => a.title).slice(0, 5),
          moreTitles: cActs.length > 5 ? cActs.length - 5 : 0,
          targetDates: Array.from(new Set(cActs.map(a => a.targetDate).filter(Boolean)))
        };
      }).sort((a, b) => b.acts - a.acts);

      return {
        name: agencyName,
        totalActs: agActs.length,
        totalRisk,
        totalValue,
        workstreams
      };
    });

    // 3. Sort agencies by total activities descending
    data.sort((a, b) => b.totalActs - a.totalActs);

    // 4. Find max activities for width scaling
    const maxActs = data.length > 0 ? data[0].totalActs : 1;

    return { agenciesData: data, maxActs };
  }, [activities]);

  if (agenciesData.length === 0) {
    return (
      <div className="w-full h-full min-h-[260px] bg-surface rounded-[24px] p-5 lg:p-6 flex flex-col">
        <h3 className="text-sm font-semibold text-primary mb-6">Delivery Flow</h3>
        <div className="flex-1 flex items-center justify-center text-sm text-muted italic">
          No activities match the current filters.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[260px] bg-surface rounded-[24px] p-5 lg:p-6 flex flex-col relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 z-10">
        <h3 className="text-sm font-semibold text-primary">Delivery Flow</h3>
        
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-4 rounded-sm bg-data-green/80"></div>
            <span className="text-[11px] font-medium text-muted uppercase tracking-wider">Completion</span>
          </div>
          <div className="flex items-center gap-1.5 ml-2">
            <div className="h-2.5 w-2.5 rounded-sm border-b-2 border-danger"></div>
            <span className="text-[11px] font-medium text-muted uppercase tracking-wider">Risk</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-3 min-h-0 relative">
        {agenciesData.map((agency) => (
          <div key={agency.name} className="flex items-stretch gap-3 group">
            {/* Agency Label */}
            <div className="w-24 sm:w-32 flex-shrink-0 flex items-center justify-end text-right pr-2 border-r border-subtle/50">
              <span className="text-xs font-semibold text-primary line-clamp-2 leading-tight">
                {agency.name}
              </span>
            </div>

            {/* Portfolio Band */}
            <div className="flex-1 flex items-center relative py-1">
              {/* Scale container */}
              <div 
                className="flex gap-1 h-10 sm:h-12"
                style={{ width: `${Math.max((agency.totalActs / maxActs) * 100, 5)}%` }}
              >
                {agency.workstreams.map(comp => {
                  const segId = `${agency.name}|${comp.name}`;
                  const isHovered = hoveredSeg === segId;
                  
                  return (
                    <button 
                      type="button"
                      key={comp.name}
                      className={cn(
                        "relative h-full rounded bg-data-periwinkle/30 border border-data-periwinkle/40 overflow-hidden cursor-pointer transition-all duration-200 flex flex-col justify-center px-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-surface",
                        comp.risk > 0 ? "border-b-[3px] border-b-danger" : "",
                        isHovered ? "opacity-90 scale-[1.02] shadow-sm z-20" : "z-10"
                      )}
                      style={{ width: `${(comp.acts / agency.totalActs) * 100}%` }}
                      onMouseEnter={() => setHoveredSeg(segId)}
                      onMouseLeave={() => setHoveredSeg(null)}
                      onFocus={() => setHoveredSeg(segId)}
                      onBlur={() => setHoveredSeg(null)}
                    >
                      {/* Completion Fill */}
                      <div 
                        className="absolute top-0 left-0 h-full bg-data-green/40 border-r border-data-green/50 transition-all duration-500"
                        style={{ width: `${comp.pctDone}%` }}
                      ></div>
                      
                      {/* Risk Corner Accent (Fallback to border-b above) */}
                      
                      {/* Content */}
                      <div className="relative z-10 pointer-events-none flex flex-col justify-center overflow-hidden">
                        {(comp.acts / agency.totalActs) > 0.15 && (
                          <span className="text-[11px] font-semibold text-primary truncate leading-tight">
                            {comp.name}
                          </span>
                        )}
                        {(comp.acts / agency.totalActs) > 0.25 && (
                          <span className={cn(
                            "text-[10px] font-medium truncate mt-0.5",
                            comp.risk > 0 ? "text-danger font-bold" : "text-secondary"
                          )}>
                            {comp.acts} acts {comp.risk > 0 ? `• ${comp.risk} risk` : ''}
                          </span>
                        )}
                      </div>

                      {/* Tooltip */}
                      {isHovered && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-3 bg-canvas border border-subtle rounded-xl shadow-xl z-50 pointer-events-none animate-in fade-in duration-100 flex flex-col gap-2">
                          <div>
                            <p className="text-[11px] uppercase tracking-wider text-muted mb-0.5 line-clamp-1">{agency.name}</p>
                            <p className="text-xs font-semibold text-primary leading-tight line-clamp-2">{comp.name}</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-y-2 gap-x-3 bg-surface p-2 rounded-lg">
                            <div>
                              <p className="text-[11px] uppercase tracking-wider text-muted mb-0.5">Total</p>
                              <p className="text-xs font-medium text-primary">{comp.acts} activities</p>
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-wider text-muted mb-0.5">Completed</p>
                              <p className="text-xs font-medium text-data-green">{comp.completed}</p>
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-wider text-muted mb-0.5">In Progress</p>
                              <p className="text-xs font-medium text-data-teal">{comp.inProgress}</p>
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-wider text-muted mb-0.5">Delayed</p>
                              <p className="text-xs font-medium text-amber-500">{comp.delayed}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-1">
                            <div>
                              <p className="text-[11px] uppercase tracking-wider text-muted mb-0.5">Est. Value</p>
                              <p className="text-xs font-medium text-primary">₹{comp.value.toLocaleString('en-IN')}L</p>
                            </div>
                            {comp.risk > 0 && (
                              <div>
                                <p className="text-[11px] uppercase tracking-wider text-muted mb-0.5">Value at Risk</p>
                                <p className="text-xs font-bold text-danger">₹{comp.riskValue.toLocaleString('en-IN')}L</p>
                              </div>
                            )}
                          </div>

                          <div className="pt-2 border-t border-subtle mt-1">
                            <p className="text-[11px] uppercase tracking-wider text-muted mb-1">Activities</p>
                            {comp.titles.map((t: string, i: number) => (
                              <p key={i} className="text-[11px] text-secondary truncate mb-0.5">• {t}</p>
                            ))}
                            {comp.moreTitles > 0 && (
                              <p className="text-[11px] text-muted italic mt-1">+ {comp.moreTitles} more</p>
                            )}
                          </div>
                          
                          {comp.targetDates.length > 0 && (
                            <div className="pt-2 border-t border-subtle mt-1">
                              <p className="text-[11px] uppercase tracking-wider text-muted mb-1">Target Dates</p>
                              <p className="text-[11px] text-secondary line-clamp-2">
                                {comp.targetDates.join(", ")}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Supporting Microcopy */}
            <div className="hidden lg:flex w-36 xl:w-48 flex-shrink-0 items-center text-[11px] xl:text-xs text-muted font-medium pl-2 opacity-60 group-hover:opacity-100 transition-opacity">
              <span className="truncate">
                {agency.totalActs} acts • ₹{agency.totalValue.toLocaleString('en-IN')}L
                {agency.totalRisk > 0 && (
                  <span className="text-danger font-semibold ml-1">• {agency.totalRisk} risk</span>
                )}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
