import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, ListFilter, ArrowDownUp, Check, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from "../../../lib/utils";
import type { SortOption } from '../hooks/useActivitiesFilters';
import type { useActivitiesFilters } from '../hooks/useActivitiesFilters';
import { createPortal } from 'react-dom';
import { usePopoverPosition } from '../../../hooks/usePopoverPosition';

interface ActivitiesToolbarProps {
  filters: ReturnType<typeof useActivitiesFilters>;
}

// Helper for popover click outside
// Helper for popover click outside
function useOutsideClick(handler: () => void, containerSelector: string) {
  const handlerRef = useRef(handler);
  
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const listener = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.closest(containerSelector)) return;
      handlerRef.current();
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [containerSelector]);
}

type FilterCategory = 'workstream' | 'subWorkstream' | 'agency' | 'timeline' | 'completion';

export function ActivitiesToolbar({ filters }: ActivitiesToolbarProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('workstream');
  const [mobileExpanded, setMobileExpanded] = useState<FilterCategory | null>('workstream');
  
  const filterBtnRef = useRef<HTMLButtonElement>(null);
  const filterPopoverRef = useRef<HTMLDivElement>(null);
  const filterPopoverStyle = usePopoverPosition({
    anchorRef: filterBtnRef,
    popoverRef: filterPopoverRef,
    isOpen: filterOpen,
    align: 'right'
  });

  useOutsideClick(() => setFilterOpen(false), '[data-filter-container]');
  useOutsideClick(() => setSortOpen(false), '[data-sort-container]');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFilterOpen(false);
        setSortOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const sortOptions = [
    { base: 'serial', label: 'Serial No.' },
    { base: 'date', label: 'Target Date' },
    { base: 'value', label: 'Est. Value' },
    { base: 'urgency', label: 'Urgency' },
    { base: 'alpha', label: 'A–Z' },
    { base: 'status', label: 'Status' },
  ];

  const toggleSelection = (current: string[], value: string, setter: (val: string[]) => void) => {
    if (current.includes(value)) {
      setter(current.filter(v => v !== value));
    } else {
      setter([...current, value]);
    }
  };

  const activeChips = useMemo(() => {
    const chips: { id: string; label: string; onRemove: () => void }[] = [];
    filters.workstream.forEach(w => {
      chips.push({ id: `ws-${w}`, label: `Workstream: ${w}`, onRemove: () => filters.setWorkstream(prev => prev.filter(x => x !== w)) });
    });
    filters.subWorkstream.forEach(sw => {
      chips.push({ id: `sw-${sw}`, label: `Sub-Workstream: ${sw}`, onRemove: () => filters.setSubWorkstream(prev => prev.filter(x => x !== sw)) });
    });
    filters.agency.forEach(a => {
      chips.push({ id: `ag-${a}`, label: `Agency: ${a}`, onRemove: () => filters.setAgency(prev => prev.filter(x => x !== a)) });
    });
    filters.timelineStatus.forEach(t => {
      chips.push({ id: `ts-${t}`, label: `Timeline: ${t}`, onRemove: () => filters.setTimelineStatus(prev => prev.filter(x => x !== t)) });
    });
    filters.completionStatus.forEach(c => {
      chips.push({ id: `cs-${c}`, label: `Completion: ${c}`, onRemove: () => filters.setCompletionStatus(prev => prev.filter(x => x !== c)) });
    });
    return chips;
  }, [filters]);

  const activeFiltersCount = activeChips.length;

  const CATEGORIES: { id: FilterCategory; label: string; current: string[]; setter: (val: string[]) => void; options: string[] }[] = [
    { id: 'workstream', label: 'Workstream', current: filters.workstream, setter: filters.setWorkstream, options: filters.availableWorkstreams.filter(x => x !== 'All') },
    { id: 'subWorkstream', label: 'Sub-Workstream', current: filters.subWorkstream, setter: filters.setSubWorkstream, options: filters.availableSubWorkstreams.filter(x => x !== 'All') },
    { id: 'agency', label: 'Agency', current: filters.agency, setter: filters.setAgency, options: filters.availableAgencies.filter(x => x !== 'All') },
    { id: 'timeline', label: 'Timeline Status', current: filters.timelineStatus, setter: filters.setTimelineStatus, options: filters.availableTimelineStatuses.filter(x => x !== 'All') },
    { id: 'completion', label: 'Completion Status', current: filters.completionStatus, setter: filters.setCompletionStatus, options: filters.availableCompletionStatuses.filter(x => x !== 'All') },
  ];

  const activeCatData = CATEGORIES.find(c => c.id === activeCategory) || CATEGORIES[0];
  const getSortLabel = () => {
    if (filters.sortBy === 'default') return 'Sort';
    const base = filters.sortBy.split('_')[0];
    const opt = sortOptions.find(o => o.base === base);
    return opt ? opt.label : 'Sort';
  };
  const selectedSortLabel = getSortLabel();

  return (
    <div className="flex flex-col gap-4 mb-6 relative">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:w-80 shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
            <Search size={16} />
          </div>
          <input
            type="text"
            className="w-full bg-surface border border-subtle text-primary text-sm rounded-lg pl-10 pr-4 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent placeholder:text-muted transition-colors"
            placeholder="Search activities, IDs, agencies..."
            value={filters.search}
            onChange={(e) => filters.setSearch(e.target.value)}
          />
          {filters.search && (
            <button
              onClick={() => filters.setSearch('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-primary transition-colors focus:outline-none"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Desktop Results Count */}
        <div className="hidden md:block flex-1 px-4">
          <span className="text-[13px] font-medium text-secondary">
            {filters.filteredCount} of {filters.totalCount} activities
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-between md:justify-end">
          
          {/* Mobile Results Count */}
          <div className="md:hidden">
            <span className="text-[13px] font-medium text-secondary">
              {filters.filteredCount} of {filters.totalCount}
            </span>
          </div>

          <div className="flex items-center gap-2 relative">
            {/* Filter Toggle */}
            <div data-filter-container className="static md:relative">
              <button
                ref={filterBtnRef}
                onClick={() => {
                  setFilterOpen(!filterOpen);
                  if (!filterOpen) setSortOpen(false);
                }}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border bg-surface px-3 h-[38px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm",
                  filterOpen ? "border-brand ring-1 ring-brand" : "border-subtle hover:bg-elevated",
                  activeFiltersCount > 0 && "bg-brand/5 border-brand/20"
                )}
              >
                <ListFilter size={15} className={activeFiltersCount > 0 ? "text-brand" : "text-secondary"} />
                <span className={cn("text-[13px] font-medium", activeFiltersCount > 0 ? "text-brand" : "text-primary")}>
                  Filters {activeFiltersCount > 0 && <span className="ml-0.5">{activeFiltersCount}</span>}
                </span>
              </button>

              {/* Filter Panel */}
              {filterOpen && (
                <>
                  {/* DESKTOP POPOVER (Two-pane) */}
                  {createPortal(
                    <div 
                      data-filter-container
                      ref={filterPopoverRef}
                      style={filterPopoverStyle}
                      className="hidden md:flex fixed w-[440px] max-h-[380px] bg-canvas border border-subtle rounded-xl shadow-md z-[100] flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                    >
                      <div className="flex flex-1 overflow-hidden h-[300px]">
                      {/* Left Pane: Categories */}
                      <div className="w-[160px] border-r border-subtle bg-surface p-2 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                        {CATEGORIES.map(cat => (
                          <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={cn(
                              "text-left px-3 py-1.5 rounded-md text-[13px] font-medium flex justify-between items-center transition-colors focus:outline-none",
                              activeCategory === cat.id ? "bg-brand/10 text-brand" : "text-primary hover:bg-elevated"
                            )}
                          >
                            <span className="truncate pr-2">{cat.label}</span>
                            {cat.current.length > 0 && (
                              <span className="bg-brand/10 text-brand text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 leading-none">
                                {cat.current.length}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Right Pane: Options */}
                      <div className="flex-1 bg-surface flex flex-col overflow-hidden">

                        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                          {activeCatData.options.length === 0 ? (
                            <div className="px-3 py-4 text-[13px] text-muted italic">No options available</div>
                          ) : (
                            <div className="flex flex-col gap-px">
                              {activeCatData.options.map(opt => {
                                const isSelected = activeCatData.current.includes(opt);
                                return (
                                  <button
                                    key={opt}
                                    onClick={() => toggleSelection(activeCatData.current, opt, activeCatData.setter)}
                                    className={cn(
                                      "flex items-center justify-between w-full text-left px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors focus:outline-none focus:bg-elevated",
                                      isSelected ? "text-brand bg-brand/10" : "text-primary hover:bg-elevated"
                                    )}
                                  >
                                    <span className="truncate">{opt}</span>
                                    {isSelected && <Check size={14} className="text-brand shrink-0 ml-3" />}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Footer */}
                    <div className="p-3 border-t border-subtle bg-surface flex justify-between items-center shrink-0">
                      <span className="text-[12px] text-secondary font-medium">
                        {activeFiltersCount === 0 ? "No filters applied" : `${activeFiltersCount} filter${activeFiltersCount !== 1 ? 's' : ''} applied`}
                      </span>
                      {activeFiltersCount > 0 && (
                        <button 
                          onClick={() => {
                            filters.setWorkstream([]);
                            filters.setSubWorkstream([]);
                            filters.setAgency([]);
                            filters.setTimelineStatus([]);
                            filters.setCompletionStatus([]);
                          }} 
                          className="text-[12px] font-medium text-brand bg-brand/5 hover:bg-brand/10 border border-brand/10 transition-colors px-2.5 py-1 rounded-md"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                  </div>
                  , document.body)}

                  {/* MOBILE SHEET (Accordion) */}
                  <div className="md:hidden fixed inset-x-0 bottom-0 w-full max-h-[85vh] bg-surface border-t border-subtle rounded-t-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-full">
                    <div className="flex items-center justify-between p-4 border-b border-subtle bg-surface shrink-0">
                      <span className="font-semibold text-primary">Filters</span>
                      {activeFiltersCount > 0 && (
                        <button onClick={() => {
                          filters.setWorkstream([]);
                          filters.setSubWorkstream([]);
                          filters.setAgency([]);
                          filters.setTimelineStatus([]);
                          filters.setCompletionStatus([]);
                        }} className="text-[13px] font-medium text-secondary hover:text-primary transition-colors">
                          Clear all
                        </button>
                      )}
                    </div>
                    
                    <div className="overflow-y-auto p-4 flex flex-col gap-3 bg-canvas flex-1 custom-scrollbar">
                      {CATEGORIES.map(cat => {
                        const isExpanded = mobileExpanded === cat.id;
                        return (
                          <div key={cat.id} className="border border-subtle rounded-xl bg-surface overflow-hidden">
                            <button
                              onClick={() => setMobileExpanded(isExpanded ? null : cat.id)}
                              className="w-full px-4 py-3 flex justify-between items-center focus:outline-none"
                            >
                              <span className="text-[14px] font-medium text-primary">{cat.label}</span>
                              <div className="flex items-center gap-3">
                                {cat.current.length > 0 && (
                                  <span className="text-[12px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                                    {cat.current.length}
                                  </span>
                                )}
                                <ChevronDown size={16} className={cn("text-secondary transition-transform", isExpanded && "rotate-180")} />
                              </div>
                            </button>
                            {isExpanded && (
                              <div className="p-2 border-t border-subtle bg-canvas">

                                <div className="flex flex-col gap-0.5">
                                  {cat.options.length === 0 ? (
                                    <div className="px-3 py-2 text-[13px] text-muted italic">No options available</div>
                                  ) : (
                                    cat.options.map(opt => {
                                      const isSelected = cat.current.includes(opt);
                                      return (
                                        <button
                                          key={opt}
                                          onClick={() => toggleSelection(cat.current, opt, cat.setter)}
                                          className={cn(
                                            "flex items-center justify-between w-full text-left px-3 py-2.5 text-[13px] font-medium rounded-md transition-colors focus:outline-none",
                                            isSelected ? "text-brand bg-brand/5" : "text-primary hover:bg-elevated"
                                          )}
                                        >
                                          <span className="truncate">{opt}</span>
                                          {isSelected && <Check size={14} className="text-brand shrink-0 ml-3" />}
                                        </button>
                                      );
                                    })
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="p-4 border-t border-subtle bg-surface shrink-0">
                      <button onClick={() => setFilterOpen(false)} className="w-full py-3 bg-brand hover:bg-brand/90 transition-colors text-white text-[14px] font-medium rounded-lg">
                        Show {filters.filteredCount} results
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Sort Toggle */}
            <div data-sort-container className="static md:relative">
              <button
                onClick={() => {
                  setSortOpen(!sortOpen);
                  if (!sortOpen) setFilterOpen(false);
                }}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border bg-surface px-3 h-[38px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm",
                  sortOpen ? "border-brand ring-1 ring-brand" : "border-subtle hover:bg-elevated"
                )}
              >
                <ArrowDownUp size={15} className="text-secondary" />
                <span className="text-[13px] font-medium text-primary hidden lg:inline-block">
                  {selectedSortLabel}
                </span>
                <span className="text-[13px] font-medium text-primary lg:hidden">
                  Sort
                </span>
              </button>

              {/* Sort Panel */}
              {sortOpen && (
                <div className="fixed md:absolute inset-x-0 bottom-0 md:bottom-auto md:top-full md:right-0 md:left-auto md:mt-2 w-full md:w-[240px] max-h-[85vh] bg-surface md:bg-canvas md:border border-subtle md:rounded-xl shadow-2xl md:shadow-md z-50 flex flex-col rounded-t-2xl md:rounded-t-xl overflow-hidden animate-in slide-in-from-bottom-full md:slide-in-from-top-2">
                  <div className="flex items-center justify-between p-4 border-b border-subtle bg-surface md:hidden shrink-0">
                    <span className="font-semibold text-primary">Sort by</span>
                    <button onClick={() => setSortOpen(false)} className="text-secondary hover:text-primary"><X size={18} /></button>
                  </div>
                  <div className="overflow-y-auto p-2 flex flex-col gap-0.5 bg-canvas">
                    {sortOptions.map(opt => {
                      const isActive = filters.sortBy.startsWith(`${opt.base}_`);
                      const isAsc = filters.sortBy === `${opt.base}_asc`;
                      
                      return (
                        <button
                          key={opt.base}
                          onClick={() => {
                            if (filters.sortBy === `${opt.base}_asc`) {
                              filters.setSortBy(`${opt.base}_desc` as SortOption);
                            } else if (filters.sortBy === `${opt.base}_desc`) {
                              filters.setSortBy('default');
                            } else {
                              filters.setSortBy(`${opt.base}_asc` as SortOption);
                            }
                          }}
                          className={cn(
                            "flex items-center justify-between w-full text-left px-3 py-3 md:py-2 text-[13px] font-medium rounded-md transition-colors focus:outline-none focus:bg-elevated",
                            isActive ? "text-brand bg-brand/5" : "text-primary hover:bg-elevated"
                          )}
                        >
                          <span className="truncate">{opt.label}</span>
                          {isActive && (
                            isAsc ? <ArrowUp size={14} className="text-brand shrink-0 ml-3" /> : <ArrowDown size={14} className="text-brand shrink-0 ml-3" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active Chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {activeChips.map(chip => (
            <div key={chip.id} className="inline-flex items-center gap-1.5 px-2 py-1 bg-surface border border-subtle rounded-md shadow-sm">
              <span className="text-[12px] font-medium text-secondary">{chip.label}</span>
              <button 
                onClick={chip.onRemove}
                className="text-secondary hover:text-danger focus:outline-none transition-colors"
                aria-label={`Remove ${chip.label}`}
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <button 
            onClick={() => {
              filters.setWorkstream([]);
              filters.setSubWorkstream([]);
              filters.setAgency([]);
              filters.setTimelineStatus([]);
              filters.setCompletionStatus([]);
            }}
            className="text-[12px] font-medium text-brand bg-brand/5 hover:bg-brand/10 border border-brand/10 transition-colors px-2.5 py-1 rounded-md ml-1"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
