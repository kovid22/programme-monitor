import { useMemo, useState } from "react";
import type { Activity } from "../../../data/types";

interface ValueConcentrationProps {
  activities: Activity[];
}

const CHART_COLORS = ['#8B75D7', '#E86E83', '#EDB04E', '#41C299'];
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
      color: CHART_COLORS[i % CHART_COLORS.length]
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

  const renderLegendBlock = (item: typeof items[0], i: number, align: 'left' | 'right') => {
    const isHovered = hoveredIdx === i;
    const isMuted = hoveredIdx !== null && hoveredIdx !== i;
    
    return (
      <div 
        key={item.name}
        className={`flex flex-col transition-all duration-300 cursor-pointer outline-none relative z-20 
          ${align === 'right' ? 'items-end text-right' : 'items-start text-left'}
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
        <div className={`flex items-center gap-1.5 mb-0.5 ${align === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>
          <span 
            className="w-2 h-2 rounded-full flex-shrink-0 transition-transform duration-300" 
            style={{ 
              backgroundColor: item.color,
              boxShadow: `0 0 6px ${item.color}60`,
              transform: isHovered ? 'scale(1.2)' : 'scale(1)'
            }} 
          />
          <span 
            className="text-[12px] font-medium text-secondary truncate max-w-[90px] xl:max-w-[130px]" 
            title={item.name}
          >
            {item.name}
          </span>
        </div>
        <div className={`flex flex-col gap-0 ${align === 'right' ? 'items-end' : 'items-start'}`}>
          <span className="text-[18px] font-medium text-primary tracking-tight leading-none">
            {Math.round(item.percentage)}%
          </span>
          <span 
            className="text-[11px] font-normal transition-colors duration-300 whitespace-nowrap mt-0.5" 
            style={{ color: isHovered ? item.color : 'var(--color-muted)' }}
          >
            {item.completed} of {item.total} completed
          </span>
        </div>
      </div>
    );
  };

  // DO NOT remove shadow-sm border border-subtle per explicit user instruction
  return (
    <div 
      className="w-full h-full bg-surface rounded-[24px] px-4 py-3 lg:px-5 lg:py-4 flex flex-col shadow-sm border border-subtle relative overflow-hidden"
      onClick={handleContainerClick}
    >
      <h3 className="text-[14px] font-semibold text-primary tracking-wide mb-1 z-10 relative">Workstream Completion</h3>

      <div className="flex-1 w-full flex flex-col items-center justify-center relative z-10">
        
        {/* Top row of legend (pulled deeply into the top empty corners of the SVG circle) */}
        <div className="flex justify-between items-end w-full px-1 mb-[-44px] z-20 pointer-events-none">
          <div className="pointer-events-auto">
            {items[0] && renderLegendBlock(items[0], 0, 'left')}
          </div>
          <div className="pointer-events-auto">
            {items[1] && renderLegendBlock(items[1], 1, 'right')}
          </div>
        </div>

        {/* Radial Chart Area */}
        <div className="relative w-[250px] h-[250px] flex-shrink-0 select-none z-10 pointer-events-none">
          <svg width="250" height="250" viewBox="0 0 250 250" className="overflow-visible pointer-events-auto">
            <defs>
              {items.map((item, i) => (
                <filter key={`glow-${i}`} id={`glow-${i}`} x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={item.color} floodOpacity="0.3" />
                </filter>
              ))}
            </defs>
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
                      opacity={0.25}
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
                      filter={isMuted ? 'none' : `url(#glow-${i})`}
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
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-center transition-opacity duration-300">
            <span className="text-[36px] font-semibold text-primary tracking-tight drop-shadow-sm leading-none transform translate-x-[4px] -translate-y-[2px]">
              {centerValue}%
            </span>
          </div>
        </div>

        {/* Bottom row of legend */}
        <div className="flex justify-between items-start w-full px-1 mt-[-44px] z-20 pointer-events-none">
          <div className="pointer-events-auto">
            {items[2] && renderLegendBlock(items[2], 2, 'left')}
          </div>
          <div className="pointer-events-auto">
            {items[3] && renderLegendBlock(items[3], 3, 'right')}
          </div>
        </div>

      </div>
    </div>
  );
}
