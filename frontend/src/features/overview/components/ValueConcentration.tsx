import { useMemo } from "react";
import type { Activity } from "../../../data/types";

interface ValueConcentrationProps {
  activities: Activity[];
}

export function ValueConcentration({ activities }: ValueConcentrationProps) {
  
  const valueData = useMemo(() => {
    const map = new Map<string, { total: number; atRisk: number }>();
    
    activities.forEach(a => {
      const val = a.estValue || 0;
      if (val === 0) return;
      
      if (!map.has(a.component)) {
        map.set(a.component, { total: 0, atRisk: 0 });
      }
      
      const isRisk = a.completionStatus !== "Completed" && (a.timelineStatus === "Overdue" || a.timelineStatus === "Immediate");
      
      map.get(a.component)!.total += val;
      if (isRisk) {
        map.get(a.component)!.atRisk += val;
      }
    });

    const arr = Array.from(map.entries())
      .map(([workstream, vals]) => ({
        workstream,
        total: vals.total,
        atRisk: vals.atRisk,
        secure: vals.total - vals.atRisk
      }))
      .sort((a, b) => b.total - a.total);

    const topworkstreams = arr.slice(0, 4);
    const hiddenCount = Math.max(0, arr.length - 4);
    const maxVal = topworkstreams.length > 0 ? Math.max(...topworkstreams.map(d => d.total)) : 0;
    
    return { data: topworkstreams, maxVal, hiddenCount };
  }, [activities]);

  if (valueData.data.length === 0) {
    return (
      <div className="w-full h-full min-h-[260px] bg-surface rounded-[24px] p-5 lg:p-6 flex flex-col">
        <h3 className="text-sm font-semibold text-primary mb-6">Value Concentration</h3>
        <div className="flex-1 flex items-center justify-center text-sm text-muted italic">
          No estimated value data available.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[260px] bg-surface rounded-[24px] p-5 lg:p-6 flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h3 className="text-sm font-semibold text-primary">Value Concentration</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-pastel-blue"></div>
            <span className="text-[10px] font-medium text-secondary uppercase tracking-wider">Secure Value</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-danger"></div>
            <span className="text-[10px] font-medium text-secondary uppercase tracking-wider">Value at Risk</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-3 lg:gap-4 justify-center">
        {valueData.data.map(item => {
          const totalWidth = (item.total / valueData.maxVal) * 100;
          const secureWidth = (item.secure / item.total) * 100;
          const riskWidth = (item.atRisk / item.total) * 100;

          return (
            <div key={item.workstream} className="flex flex-col gap-1 group cursor-crosshair">
              <div className="flex items-end justify-between">
                <span className="text-xs font-medium text-primary">{item.workstream}</span>
                <div className="flex items-center gap-2">
                  {item.atRisk > 0 && (
                    <span className="text-[10px] font-medium text-danger">
                      ₹{item.atRisk.toLocaleString('en-IN', { maximumFractionDigits: 1 })}L at risk ({Math.round(riskWidth)}%)
                    </span>
                  )}
                  <span className="text-[10px] font-semibold text-primary">₹{item.total.toLocaleString('en-IN', { maximumFractionDigits: 1 })}L</span>
                </div>
              </div>
              
              {/* Bar */}
              <div className="w-full h-3 bg-canvas rounded-sm overflow-hidden flex">
                <div 
                  style={{ width: `${totalWidth}%` }} 
                  className="h-full flex transition-all"
                >
                  {/* Secure Segment */}
                  {secureWidth > 0 && (
                    <div 
                      style={{ width: `${secureWidth}%` }} 
                      className="h-full bg-pastel-blue border-r border-surface last:border-0 relative"
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block w-max px-2 py-1 bg-canvas border border-subtle rounded shadow-lg z-10 text-[9px]">
                        ₹{item.secure.toLocaleString('en-IN', { maximumFractionDigits: 1 })}L Secure
                      </div>
                    </div>
                  )}
                  {/* At Risk Segment */}
                  {riskWidth > 0 && (
                    <div 
                      style={{ width: `${riskWidth}%` }} 
                      className="h-full bg-danger border-r border-surface last:border-0 relative"
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block w-max px-2 py-1 bg-canvas border border-subtle rounded shadow-lg z-10 text-[9px] text-danger font-semibold">
                        ₹{item.atRisk.toLocaleString('en-IN', { maximumFractionDigits: 1 })}L At Risk
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {valueData.hiddenCount > 0 && (
          <div className="text-center pt-1 mt-1 border-t border-subtle/50">
            <span className="text-[10px] font-medium text-secondary">
              + {valueData.hiddenCount} more workstream{valueData.hiddenCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
