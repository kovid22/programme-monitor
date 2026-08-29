import { useMemo, useState } from 'react';
import type { Activity } from '../../../data/types';
import { cn } from '../../../lib/utils';

interface ValueConcentrationProps {
  activities: Activity[];
  selectedAgencies: string[];
}

const AGENCIES = ['DoE', 'DoR', 'JSV', 'PWD', 'HPSRLM'] as const;
const AGENCY_COLORS = [
  'var(--color-cat-purple)',
  'var(--color-cat-pink)',
  'var(--color-cat-amber)',
  'var(--color-cat-teal)',
  'var(--color-state-scheduled)',
] as const;

const CHART_WIDTH = 420;
const CHART_HEIGHT = 240;
const CHART_CENTER_X = CHART_WIDTH / 2;
const CHART_CENTER_Y = CHART_HEIGHT / 2;
const DONUT_RADIUS = 90;
const DONUT_STROKE_WIDTH = 40;

function getAnnularSectorPath(cx: number, cy: number, r: number, R: number, startAngle: number, endAngle: number, d: number) {
  if (endAngle - startAngle <= 0) return "";
  
  const nx1 = -Math.sin(startAngle);
  const ny1 = Math.cos(startAngle);
  const nx2 = Math.sin(endAngle);
  const ny2 = -Math.cos(endAngle);

  const x1 = cx + R * Math.cos(startAngle) + d * nx1;
  const y1 = cy + R * Math.sin(startAngle) + d * ny1;
  const x2 = cx + R * Math.cos(endAngle) + d * nx2;
  const y2 = cy + R * Math.sin(endAngle) + d * ny2;
  const x3 = cx + r * Math.cos(endAngle) + d * nx2;
  const y3 = cy + r * Math.sin(endAngle) + d * ny2;
  const x4 = cx + r * Math.cos(startAngle) + d * nx1;
  const y4 = cy + r * Math.sin(startAngle) + d * ny1;

  const largeArcFlag = endAngle - startAngle <= Math.PI ? 0 : 1;
  return `M ${x1} ${y1} A ${R} ${R} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${r} ${r} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;
}

export function ValueConcentration({ activities, selectedAgencies }: ValueConcentrationProps) {
  const [hoveredAgency, setHoveredAgency] = useState<string | null>(null);

  const { agencyWorkload, isEmpty } = useMemo(() => {
    const agenciesToDisplay = selectedAgencies.length > 0 ? selectedAgencies : AGENCIES;
    const assignmentCounts = new Map(agenciesToDisplay.map((agency) => [agency, 0]));

    let total = 0;
    activities.forEach((activity) => {
      const assignedAgencies = new Set(activity.agencies);

      agenciesToDisplay.forEach((agency) => {
        if (assignedAgencies.has(agency)) {
          assignmentCounts.set(agency, (assignmentCounts.get(agency) ?? 0) + 1);
          total++;
        }
      });
    });

    const workloads = agenciesToDisplay.map((agency, colorIndex) => {
      const count = assignmentCounts.get(agency) ?? 0;
      const exactPercentage = total > 0 ? (count / total) * 100 : 0;
      const floored = Math.floor(exactPercentage);
      const share = total > 0 ? count / total : 0;
      
      return {
        name: agency,
        count,
        share,
        remainder: exactPercentage - floored,
        displayPercentage: floored,
        segmentStart: 0,
        color: AGENCY_COLORS[colorIndex >= 0 ? colorIndex : 0],
      };
    }).sort((a, b) => b.share - a.share);

    if (total > 0) {
      const totalFloored = workloads.reduce((sum, w) => sum + w.displayPercentage, 0);
      const diff = 100 - totalFloored;

      const sortedIndices = workloads
        .map((w, i) => ({ i, remainder: w.remainder }))
        .sort((a, b) => b.remainder - a.remainder);

      for (let i = 0; i < diff; i++) {
        workloads[sortedIndices[i].i].displayPercentage += 1;
      }
    }

    const finalWorkloads = workloads.map((w, index) => {
      const precedingSum = workloads
        .slice(0, index)
        .reduce((sum, precedingWorkload) => sum + precedingWorkload.share, 0);

      // By starting at 1 and subtracting, we reverse the visual placement 
      // so the hierarchy flows anti-clockwise from 12 o'clock.
      const segmentStart = 1 - precedingSum - w.share;

      return {
        ...w,
        segmentStart,
      };
    });

    return {
      agencyWorkload: finalWorkloads,
      isEmpty: total === 0,
    };
  }, [activities, selectedAgencies]);


  const chartLabels = useMemo(() => {
    const validAgencies = agencyWorkload.filter((a) => a.count > 0);
    return validAgencies.map((agency) => {
      const proportionMidpoint = agency.segmentStart + (agency.share / 2);
      const angle = (-Math.PI / 2) + (proportionMidpoint * Math.PI * 2);
      const side = Math.cos(angle) >= 0 ? 'right' : 'left';

      const ELBOW_RADIUS = DONUT_RADIUS + (DONUT_STROKE_WIDTH / 2) + 12;
      const elbowX = CHART_CENTER_X + Math.cos(angle) * ELBOW_RADIUS;
      const elbowY = CHART_CENTER_Y + Math.sin(angle) * ELBOW_RADIUS;

      const HORIZONTAL_LENGTH = 28;
      const lineEndX = side === 'right' ? elbowX + HORIZONTAL_LENGTH : elbowX - HORIZONTAL_LENGTH;
      const textX = side === 'right' ? lineEndX + 10 : lineEndX - 10;

      return {
        ...agency,
        angle,
        side,
        labelY: elbowY,
        elbowX,
        lineEndX,
        textX,
      };
    });
  }, [agencyWorkload]);

  if (isEmpty) {
    return (
      <div className="workload-chart-card flex h-full w-full flex-col rounded-[24px] border border-subtle bg-surface p-5 shadow-sm lg:p-6">
        <h3 className="mb-3 text-base font-semibold tracking-wide text-primary">Agency Workload Distribution</h3>
        <div className="flex flex-1 items-center justify-center text-sm text-secondary min-h-0">
          No workload in current scope
        </div>
      </div>
    );
  }

  const renderDonut = (withLabels: boolean) => (
    <svg
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      className={cn("overflow-visible", withLabels ? "w-full max-w-[420px] h-auto" : "h-[172px] w-[220px]")}
      role="img"
      aria-label="Agency workload distribution"
    >
      <g transform={`rotate(-90 ${CHART_CENTER_X} ${CHART_CENTER_Y})`}>
        {agencyWorkload.map((agency) => {
          if (agency.count === 0) return null;
          
          const CORNER_RADIUS = 3;
          const VISUAL_GAP = 3;
          
          // Using parallel offset math (secants), d is the perpendicular offset distance.
          // We want the final visual gap to be VISUAL_GAP.
          // Because strokeLinejoin="round" expands the slice outward by CORNER_RADIUS,
          // the mathematical path must be inset by an additional CORNER_RADIUS.
          // The distance from the center of the gap to the mathematical path boundary is therefore:
          const d = (VISUAL_GAP / 2) + CORNER_RADIUS;
          
          const startAngle = agency.segmentStart * 2 * Math.PI;
          const endAngle = (agency.segmentStart + agency.share) * 2 * Math.PI;
          
          const outerR = DONUT_RADIUS + (DONUT_STROKE_WIDTH / 2) - CORNER_RADIUS;
          const innerR = DONUT_RADIUS - (DONUT_STROKE_WIDTH / 2) + CORNER_RADIUS;

          return (
            <path
              key={agency.name}
              d={getAnnularSectorPath(CHART_CENTER_X, CHART_CENTER_Y, innerR, outerR, startAngle, endAngle, d)}
              fill={agency.color}
              stroke={agency.color}
              strokeWidth={CORNER_RADIUS * 2}
              strokeLinejoin="round"
              className={cn(
                "transition-opacity duration-150 cursor-pointer",
                hoveredAgency && hoveredAgency !== agency.name && "opacity-30",
              )}
              onMouseEnter={() => setHoveredAgency(agency.name)}
              onMouseLeave={() => setHoveredAgency(null)}
            />
          );
        })}
      </g>

      {withLabels && chartLabels.map((label) => {
        const anchorX = CHART_CENTER_X + (Math.cos(label.angle) * (DONUT_RADIUS + (DONUT_STROKE_WIDTH / 2)));
        const anchorY = CHART_CENTER_Y + (Math.sin(label.angle) * (DONUT_RADIUS + (DONUT_STROKE_WIDTH / 2)));
        const textAnchor = label.side === 'right' ? 'start' : 'end';
        const isMuted = hoveredAgency !== null && hoveredAgency !== label.name;

        return (
          <g
            key={label.name}
            className={cn("outline-none transition-opacity duration-150", isMuted && "opacity-35")}
            onMouseEnter={() => setHoveredAgency(label.name)}
            onMouseLeave={() => setHoveredAgency(null)}
            onFocus={() => setHoveredAgency(label.name)}
            onBlur={() => setHoveredAgency(null)}
            tabIndex={0}
            role="group"
            aria-label={`${label.name}: ${label.displayPercentage} percent`}
          >
            <path
              d={`M ${anchorX} ${anchorY} L ${label.elbowX} ${label.labelY} L ${label.lineEndX} ${label.labelY}`}
              fill="none"
              stroke="var(--color-secondary)"
              strokeWidth="1.25"
              opacity="0.3"
            />
            <text x={label.textX} y={label.labelY - 7} textAnchor={textAnchor} fill="var(--color-secondary)" className="text-[14px] font-medium">
              {label.name}
            </text>
            <text x={label.textX} y={label.labelY + 14} textAnchor={textAnchor} fill="var(--color-primary)" className="text-[14px] font-bold">
              {label.displayPercentage}%
            </text>
          </g>
        );
      })}
    </svg>
  );

  return (
    <div className="workload-chart-card flex h-full w-full flex-col rounded-[24px] border border-subtle bg-surface p-5 shadow-sm lg:p-6">
      <h3 className="mb-3 text-base font-semibold tracking-wide text-primary">Agency Workload Distribution</h3>

      <div className="workload-chart-external hidden lg:flex flex-1 items-center justify-center min-h-0">
        {renderDonut(true)}
      </div>

      <div className="workload-chart-fallback flex flex-1 flex-col items-center justify-center lg:hidden min-h-0">
        <div className="mb-6 mt-2 flex items-center justify-center">
          {renderDonut(false)}
        </div>
        <div className="grid w-full max-w-[280px] grid-cols-2 gap-x-4 gap-y-3">
          {chartLabels.map((label) => (
            <div
              key={label.name}
              className={cn(
                "flex items-center gap-2 transition-opacity duration-150",
                hoveredAgency && hoveredAgency !== label.name && "opacity-40"
              )}
              onMouseEnter={() => setHoveredAgency(label.name)}
              onMouseLeave={() => setHoveredAgency(null)}
            >
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: label.color }} />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-primary">{label.name}</span>
                <span className="text-xs text-secondary">{label.displayPercentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
