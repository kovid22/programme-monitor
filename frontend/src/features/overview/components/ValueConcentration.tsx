import { useMemo, useState } from "react";
import type { Activity } from "../../../data/types";

interface ValueConcentrationProps {
  activities: Activity[];
}

const CHART_THEME = [
  { color: 'var(--color-cat-purple)', glow: 'var(--theme-drop-cat-purple)' },
  { color: 'var(--color-cat-pink)', glow: 'var(--theme-drop-cat-pink)' },
  { color: 'var(--color-cat-amber)', glow: 'var(--theme-drop-cat-amber)' },
  { color: 'var(--color-cat-teal)', glow: 'var(--theme-drop-cat-teal)' }
];
const RING_RADII = [115, 95, 75, 55]; 
const CENTER_X = 125;
const CENTER_Y = 125;
const STROKE_WIDTH = 14;
const HOVER_STROKE_WIDTH = 18;

export function ValueConcentration({ activities }: ValueConcentrationProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const { overallPercentage, items } = useMemo(() => {
    let totalCompleted = 0;
    let totalCount = 0;
    const map = new Map<string, { completed: number; total: number }>();

    activities.forEach(a => {
      totalCount++;
      const isCompleted = a.completionStatus === 'Completed';
      if (isCompleted) totalCompleted++;

      const ws = (a.component && a.component.trim() !== '') ? a.component.trim() : 'Unknown';
      if (!map.has(ws)) map.set(ws, { completed: 0, total: 0 });
      const stats = map.get(ws)!;
      stats.total++;
      if (isCompleted) stats.completed++;
    });

    const overallPct = totalCount > 0 ? (totalCompleted / totalCount) * 100 : 0;

    const arr = Array.from(map.entries())
      .map(([name, stats]) => ({
        name,
        total: stats.total,
        completed: stats.completed,
        percentage: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);

    const finalItems = arr.slice(0, 4).map((item, i) => ({
      ...item,
      color: CHART_THEME[i % CHART_THEME.length].color,
      glow: CHART_THEME[i % CHART_THEME.length].glow
    }));

    return { overallPercentage: overallPct, items: finalItems };
  }, [activities]);

  if (items.length === 0) {
    return (
      <div className="w-full bg-surface rounded-[24px] p-5 flex flex-col shadow-sm border border-subtle">
        <h3 className="text-[14px] font-semibold text-primary tracking-wide mb-6 z-10 relative">Workstream Completion</h3>
        <div className="flex items-center justify-center text-[13px] text-muted italic py-10">
          No activities available
        </div>
      </div>
    );
  }

  const hoverItem = hoveredIdx !== null ? items[hoveredIdx] : null;
  const centerValue = hoverItem ? Math.round(hoverItem.percentage) : Math.round(overallPercentage);

  const handleContainerClick = () => setHoveredIdx(null);

  const renderLegendBlock = (item: typeof items[0], i: number) => {
    const isHovered = hoveredIdx === i;
    const isMuted = hoveredIdx !== null && hoveredIdx !== i;
    
    return (
      <div 
        key={item.name}
        className={`flex items-start gap-2.5 transition-all duration-300 cursor-pointer outline-none relative z-20
          ${isHovered ? 'scale-[1.02] drop-shadow-sm' : ''}
          ${isMuted ? 'opacity-30 grayscale-[20%]' : 'opacity-100'}`}
        onMouseEnter={() => setHoveredIdx(i)}
        onMouseLeave={() => setHoveredIdx(null)}
        onClick={(e) => {
          e.stopPropagation();
          setHoveredIdx(hoveredIdx === i ? null : i);
        }}
        onFocus={() => setHoveredIdx(i)}
        onBlur={() => setHoveredIdx(null)}
        tabIndex={0}
      >
        <span 
          className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-[3px] transition-transform duration-300" 
          style={{ 
            backgroundColor: item.color,
            transform: isHovered ? 'scale(1.2)' : 'scale(1)'
          }} 
        />
        <div className="flex flex-col">
          <span 
            className="text-[12px] font-semibold text-secondary truncate max-w-[140px]" 
            title={item.name}
          >
            {item.name}
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-[15px] font-semibold text-primary tracking-tight leading-none">
              {Math.round(item.percentage)}%
            </span>
            <span 
              className="text-[11px] font-medium transition-colors duration-300 whitespace-nowrap" 
              style={{ color: isHovered ? item.color : 'var(--color-muted)' }}
            >
              {item.completed} / {item.total}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      className="w-full h-full bg-surface rounded-[24px] p-5 lg:p-6 flex flex-col shadow-sm border border-subtle relative overflow-hidden"
      onClick={handleContainerClick}
    >
      <h3 className="text-base font-semibold text-primary tracking-wide mb-2 z-10 relative flex-shrink-0">Workstream Completion</h3>

      <div className="flex-1 w-full flex flex-col lg:flex-row items-center justify-center relative z-10 gap-8 lg:gap-12 lg:pr-8">
        
        {/* Left side radial chart */}
        <div className="w-full lg:w-auto flex items-center justify-center">
          <div className="relative w-[250px] h-[250px] flex-shrink-0 select-none z-10 pointer-events-none">
            <svg width="250" height="250" viewBox="0 0 250 250" className="overflow-visible pointer-events-auto">
              <g transform={`rotate(-90 ${CENTER_X} ${CENTER_Y})`}>
                {items.map((item, i) => {
                  const radius = RING_RADII[i];
                  const circumference = 2 * Math.PI * radius;
                  const percentage = item.percentage / 100;
                  // Cap slightly below 1 to prevent SVG dash offset glitches on full circles
                  const offset = circumference - (Math.min(percentage, 0.9999) * circumference);
                  
                  const isHovered = hoveredIdx === i;
                  const isMuted = hoveredIdx !== null && hoveredIdx !== i;
                  const strokeW = isHovered ? HOVER_STROKE_WIDTH : STROKE_WIDTH;
                  
                  return (
                    <g 
                      key={item.name} 
                      className="transition-all duration-300 cursor-pointer focus:outline-none outline-none"
                      onMouseEnter={() => setHoveredIdx(i)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setHoveredIdx(hoveredIdx === i ? null : i);
                      }}
                      onFocus={() => setHoveredIdx(i)}
                      onBlur={() => setHoveredIdx(null)}
                      tabIndex={0}
                      role="button"
                      aria-label={`${item.name}: ${Math.round(item.percentage)}% completed`}
                    >
                      {/* Colored Background Track (Very muted version of its own color) */}
                      <circle
                        cx={CENTER_X}
                        cy={CENTER_Y}
                        r={radius}
                        fill="none"
                        stroke={item.color}
                        strokeWidth={STROKE_WIDTH}
                        opacity={0.15}
                        className="transition-opacity"
                      />
                      
                      {/* Value arc */}
                      <circle
                        cx={CENTER_X}
                        cy={CENTER_Y}
                        r={radius}
                        fill="none"
                        stroke={item.color}
                        strokeWidth={strokeW}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        opacity={isMuted ? 0.3 : 1}
                        style={{ filter: isMuted ? 'none' : item.glow }}
                        className="transition-all duration-300 ease-out origin-center"
                      />
                      
                      {/* Invisible thicker hover hit area */}
                      <circle
                        cx={CENTER_X}
                        cy={CENTER_Y}
                        r={radius}
                        fill="none"
                        stroke="transparent"
                        strokeWidth={24}
                      />
                    </g>
                  );
                })}
              </g>
            </svg>
            
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center transition-opacity duration-300">
              <span className="text-[36px] font-semibold text-primary tracking-tight drop-shadow-sm leading-none transform translate-x-[4px]">
                {centerValue}%
              </span>
              <span className="text-[12px] font-medium text-muted uppercase mt-1 tracking-wider">
                TOTAL
              </span>
            </div>
          </div>
        </div>

        {/* Right side labels */}
        <div className="w-full lg:w-auto flex flex-col justify-center gap-4 z-20">
          {items.map((item, i) => renderLegendBlock(item, i))}
        </div>
      </div>
    </div>
  );
}
