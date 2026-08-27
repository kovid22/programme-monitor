import { useMemo, useState } from "react";
import type { Activity } from "../../../data/types";
import { getPresentationState } from "../../../lib/statusUtils";
import { formatCurrencyValue, cn } from "../../../lib/utils";
import { PRESENTATION_STATES } from "../../../data/constants";

interface DeliveryFlowProps {
  activities: Activity[];
}

const STATE_CLASSES: Record<string, string> = {
  [PRESENTATION_STATES.COMPLETED]: 'bg-state-completed shadow-glow-completed',
  [PRESENTATION_STATES.AT_RISK]: 'bg-state-risk shadow-glow-risk',
  [PRESENTATION_STATES.SCHEDULED]: 'bg-state-scheduled shadow-glow-scheduled',
  [PRESENTATION_STATES.TBC]: 'bg-state-tbc shadow-glow-tbc'
};

const ORDER = [
  PRESENTATION_STATES.COMPLETED, 
  PRESENTATION_STATES.AT_RISK, 
  PRESENTATION_STATES.SCHEDULED, 
  PRESENTATION_STATES.TBC
];
const AGENCIES = ["DoE", "DoR", "JSV", "PWD", "HPSRLM"] as const;

export function DeliveryFlow({ activities }: DeliveryFlowProps) {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    agency: string;
    state: string;
    value: number;
    pct: number;
  } | null>(null);

  const { agencyExposure, maxValue, hasNumericValue } = useMemo(() => {
    const numericActivities = activities.filter(
      (activity) => typeof activity.estValue === "number" && Number.isFinite(activity.estValue)
    );
    const agencyMap = new Map(AGENCIES.map((agency) => [agency, {
      total: 0,
      states: {
        [PRESENTATION_STATES.COMPLETED]: 0,
        [PRESENTATION_STATES.AT_RISK]: 0,
        [PRESENTATION_STATES.SCHEDULED]: 0,
        [PRESENTATION_STATES.TBC]: 0,
      },
    }]));

    numericActivities.forEach((activity) => {
      const value = activity.estValue!;
      const presentationState = getPresentationState(activity);
      const assignedAgencies = new Set(activity.agencies);

      AGENCIES.forEach((agency) => {
        if (!assignedAgencies.has(agency)) return;

        const entry = agencyMap.get(agency)!;
        entry.total += value;
        entry.states[presentationState] += value;
      });
    });

    const exposure = AGENCIES.map((agency) => ({
      name: agency,
      ...agencyMap.get(agency)!,
    })).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
    const max = Math.max(...exposure.map((agency) => agency.total));

    return {
      agencyExposure: exposure,
      maxValue: max,
      hasNumericValue: numericActivities.length > 0,
    };
  }, [activities]);

  if (!hasNumericValue) {
    return (
      <div className="w-full h-full min-h-[260px] bg-surface rounded-[24px] p-5 lg:p-6 flex flex-col shadow-sm border border-subtle">
        <h3 className="text-base font-semibold text-primary tracking-wide mb-6">Agency Delivery Exposure</h3>
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
      <div className="mb-8">
        <h3 className="text-base font-semibold text-primary tracking-wide">Agency Delivery Exposure</h3>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-8 w-full pb-2">
        {agencyExposure.map((agency) => {
          const breakdownText = ORDER.map(state => {
            const val = agency.states[state];
            if (!val) return null;
            return `${state}: ${formatCurrencyValue(val)}`;
          }).filter(Boolean).join(", ");
          
          return (
          <div 
            key={agency.name}
            className="flex items-center gap-4 w-full rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            tabIndex={0}
            role="group"
            aria-label={`${agency.name}. Total value: ${formatCurrencyValue(agency.total)}. Breakdown: ${breakdownText}`}
          >
            <div className="w-[120px] sm:w-[150px] shrink-0">
              <span 
                className="text-[13px] font-medium text-primary truncate block leading-tight" 
                title={agency.name}
              >
                {agency.name}
              </span>
            </div>
            
            <div className="flex-1 h-[24px] bg-slate-100/70 dark:bg-slate-800/30 rounded-[6px] relative">
              <div 
                className="absolute left-0 top-0 bottom-0 flex gap-[1px]"
                style={{ width: `${maxValue > 0 ? (agency.total / maxValue) * 100 : 0}%` }}
              >
                {ORDER.map(state => {
                  const val = agency.states[state] || 0;
                  if (val === 0) return null;
                  
                  const pctOfAgency = (val / agency.total) * 100;
                  const segmentId = `${agency.name}-${state}`;
                  
                  return (
                    <div
                      key={state}
                      className={cn("h-full cursor-pointer transition-opacity duration-150 ease-out rounded-[6px] shrink", STATE_CLASSES[state])}
                      style={{ 
                        flex: `0 1 ${pctOfAgency}%`,
                        minWidth: '4px',
                        opacity: hoveredSegment ? (hoveredSegment === segmentId ? 1 : 0.25) : 1
                      }}
                      onMouseEnter={() => setHoveredSegment(segmentId)}
                      onMouseMove={(e) => {
                        setTooltip({
                          x: e.clientX,
                          y: e.clientY,
                          agency: agency.name,
                          state,
                          value: val,
                          pct: pctOfAgency
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
                {formatCurrencyValue(agency.total)}
              </span>
            </div>
          </div>
        )})}
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-5 pt-6 mt-1 text-[13px] text-secondary font-medium">
        {ORDER.map(state => (
          <div key={state} className="flex items-center gap-1.5">
            <span className={cn("w-2.5 h-2.5 rounded-full", STATE_CLASSES[state])} />
            {state}
          </div>
        ))}
      </div>

      {/* Tooltip Overlay */}
      {tooltip && (
        <div 
          className="fixed z-50 pointer-events-none bg-surface border border-subtle shadow-lg rounded-xl p-3.5 flex flex-col min-w-[180px]"
          style={{ left: tooltip.x + 16, top: tooltip.y + 16 }}
        >
          <span className="text-[11px] font-semibold tracking-wider text-muted uppercase mb-1">{tooltip.agency}</span>
          <div className="flex items-center gap-2 mb-2">
            <div className={cn("w-2 h-2 rounded-full", STATE_CLASSES[tooltip.state])} />
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
