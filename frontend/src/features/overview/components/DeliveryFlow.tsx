import { useMemo, useState } from "react";
import type { Activity } from "../../../data/types";
import { getPresentationState } from "../../../lib/statusUtils";
import { formatCurrencyValue } from "../../../lib/utils";
import { PRESENTATION_STATES } from "../../../data/constants";

interface DeliveryFlowProps {
  activities: Activity[];
}

const STATE_COLORS: Record<string, string> = {
  [PRESENTATION_STATES.COMPLETED]: '#10b981',
  [PRESENTATION_STATES.AT_RISK]: '#f43f5e',
  [PRESENTATION_STATES.SCHEDULED]: '#6366f1',
  [PRESENTATION_STATES.TBC]: '#94a3b8'
};

const ORDER = [
  PRESENTATION_STATES.COMPLETED, 
  PRESENTATION_STATES.AT_RISK, 
  PRESENTATION_STATES.SCHEDULED, 
  PRESENTATION_STATES.TBC
];

export function DeliveryFlow({ activities }: DeliveryFlowProps) {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    ws: string;
    state: string;
    value: number;
    pct: number;
  } | null>(null);

  const { top5, maxVal } = useMemo(() => {
    const valid = activities.filter(a => typeof a.estValue === 'number' && a.estValue > 0);
    const wsMap = new Map<string, { total: number; states: Record<string, number> }>();

    valid.forEach(a => {
      const val = a.estValue!;
      const ws = a.component?.trim() || 'Unknown';
      
      if (!wsMap.has(ws)) {
        wsMap.set(ws, { 
          total: 0, 
          states: { 
            [PRESENTATION_STATES.COMPLETED]: 0, 
            [PRESENTATION_STATES.AT_RISK]: 0, 
            [PRESENTATION_STATES.SCHEDULED]: 0, 
            [PRESENTATION_STATES.TBC]: 0 
          } 
        });
      }
      
      const entry = wsMap.get(ws)!;
      entry.total += val;

      const pState = getPresentationState(a);
      entry.states[pState] += val;
    });

    const top = Array.from(wsMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const max = top.length > 0 ? Math.max(...top.map(w => w.total)) : 0;

    return { top5: top, maxVal: max };
  }, [activities]);

  if (top5.length === 0) {
    return (
      <div className="w-full h-full min-h-[260px] bg-surface rounded-[24px] p-5 lg:p-6 flex flex-col shadow-sm border border-subtle">
        <h3 className="text-[14px] font-semibold text-primary tracking-wide mb-6">Workstream Value by Delivery State</h3>
        <div className="flex-1 flex items-center justify-center text-[13px] text-muted italic">
          No value data available
        </div>
      </div>
    );
  }

  return (
    <div 
      className="w-full h-full min-h-[300px] bg-surface rounded-[24px] p-5 lg:p-6 flex flex-col shadow-sm border border-subtle relative"
      onMouseLeave={() => { setHoveredSegment(null); setTooltip(null); }}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div className="flex flex-col">
          <h3 className="text-[14px] font-semibold text-primary tracking-wide">Workstream Value by Delivery State</h3>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          {ORDER.map(state => (
            <div key={state} className="flex items-center gap-1.5">
              <div 
                className="w-2.5 h-2.5 rounded-full" 
                style={{ backgroundColor: STATE_COLORS[state] }} 
              />
              <span className="text-[12px] font-medium text-muted">{state}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-8 w-full pb-2">
        {top5.map((ws) => {
          const breakdownText = ORDER.map(state => {
            const val = ws.states[state];
            if (!val) return null;
            return `${state}: ${formatCurrencyValue(val)}`;
          }).filter(Boolean).join(", ");
          
          return (
          <div 
            key={ws.name} 
            className="flex items-center gap-4 w-full rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            tabIndex={0}
            role="group"
            aria-label={`${ws.name}. Total value: ${formatCurrencyValue(ws.total)}. Breakdown: ${breakdownText}`}
          >
            <div className="w-[120px] sm:w-[150px] shrink-0">
              <span 
                className="text-[13px] font-medium text-primary truncate block leading-tight" 
                title={ws.name}
              >
                {ws.name}
              </span>
            </div>
            
            <div className="flex-1 h-[24px] bg-slate-100/70 dark:bg-slate-800/30 rounded-[4px] relative">
              <div 
                className="absolute left-0 top-0 bottom-0 flex gap-[1px]"
                style={{ width: `${(ws.total / maxVal) * 100}%` }}
              >
                {ORDER.map(state => {
                  const val = ws.states[state] || 0;
                  if (val === 0) return null;
                  
                  const pctOfWs = (val / ws.total) * 100;
                  const segmentId = `${ws.name}-${state}`;
                  
                  return (
                    <div
                      key={state}
                      className="h-full cursor-pointer transition-opacity duration-150 ease-out rounded-[4px] shrink"
                      style={{ 
                        flex: `0 1 ${pctOfWs}%`,
                        minWidth: '4px',
                        backgroundColor: STATE_COLORS[state],
                        opacity: hoveredSegment ? (hoveredSegment === segmentId ? 1 : 0.25) : 1
                      }}
                      onMouseEnter={() => setHoveredSegment(segmentId)}
                      onMouseMove={(e) => {
                        setTooltip({
                          x: e.clientX,
                          y: e.clientY,
                          ws: ws.name,
                          state,
                          value: val,
                          pct: pctOfWs
                        });
                      }}
                      onMouseLeave={() => {
                        setHoveredSegment(null);
                        setTooltip(null);
                      }}
                    />
                  );
                })}
              </div>
            </div>

            <div className="w-[60px] sm:w-[70px] shrink-0 text-right">
              <span className="text-[13px] font-medium text-muted">
                {formatCurrencyValue(ws.total)}
              </span>
            </div>
          </div>
        )})}
      </div>

      {/* Tooltip Overlay */}
      {tooltip && (
        <div 
          className="fixed z-50 pointer-events-none bg-surface border border-subtle shadow-lg rounded-xl p-3.5 flex flex-col min-w-[180px]"
          style={{ left: tooltip.x + 16, top: tooltip.y + 16 }}
        >
          <span className="text-[11px] font-semibold tracking-wider text-muted uppercase mb-1">{tooltip.ws}</span>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATE_COLORS[tooltip.state] }} />
            <span className="text-[13px] font-medium text-primary">{tooltip.state}</span>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-t border-subtle pt-2 mt-1">
            <span className="text-[14px] font-bold text-primary">{formatCurrencyValue(tooltip.value)}</span>
            <span className="text-[12px] font-medium text-muted">{Math.round(tooltip.pct)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
