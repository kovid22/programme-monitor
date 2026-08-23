import { useState, useRef, useEffect } from 'react';
import { ListFilter, Check, ChevronDown } from 'lucide-react';
import { cn } from "../../../lib/utils";
import type { useOverviewFilters } from '../hooks/useOverviewFilters';
import { createPortal } from 'react-dom';
import { usePopoverPosition } from '../../../hooks/usePopoverPosition';

interface FilterBarProps {
  filters: ReturnType<typeof useOverviewFilters>['filters'];
}

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

type FilterCategory = 'workstream' | 'subWorkstream' | 'agency';

export function FilterBar({ filters }: FilterBarProps) {
  const [filterOpen, setFilterOpen] = useState(false);
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFilterOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleSelection = (current: string[], value: string, setter: (val: string[]) => void) => {
    if (current.includes(value)) {
      setter(current.filter(v => v !== value));
    } else {
      setter([...current, value]);
    }
  };

  const activeFiltersCount = filters.workstream.length + filters.subWorkstream.length + filters.agency.length;

  const CATEGORIES: { id: FilterCategory; label: string; current: string[]; setter: (val: string[]) => void; options: string[] }[] = [
    { id: 'workstream', label: 'Workstream', current: filters.workstream, setter: filters.setWorkstream, options: filters.availableWorkstreams },
    { id: 'subWorkstream', label: 'Sub-Workstream', current: filters.subWorkstream, setter: filters.setSubWorkstream, options: filters.availableSubWorkstreams },
    { id: 'agency', label: 'Agency', current: filters.agency, setter: filters.setAgency, options: filters.availableAgencies },
  ];

  const activeCatData = CATEGORIES.find(c => c.id === activeCategory) || CATEGORIES[0];

  return (
    <div className="flex flex-col gap-2 relative mt-4 md:mt-0 w-full md:w-auto">
      {/* Top Bar / Summary / Filter Toggle */}
      <div className="flex flex-col md:flex-row items-end justify-between gap-4">
        
        {/* Results Count & Filter Toggle Container */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          
          <div className="text-[13px] font-medium text-secondary">
            Showing {filters.filteredCount} of {filters.totalCount} activities
          </div>

          <div data-filter-container className="static md:relative shrink-0">
            <button
              ref={filterBtnRef}
              onClick={() => setFilterOpen(!filterOpen)}
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
                        onClick={filters.resetFilters} 
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
                      <button onClick={filters.resetFilters} className="text-[13px] font-medium text-secondary hover:text-primary transition-colors">
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
        </div>
      </div>


    </div>
  );
}
