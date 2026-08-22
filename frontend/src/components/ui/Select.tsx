import { cn } from "../../lib/utils";
import { ChevronDown, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  className?: string;
}

export function Select({ label, value, options, onChange, className }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value) || options[0];

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        className={cn(
          "inline-flex items-center gap-2.5 rounded-lg border border-subtle bg-surface px-3.5 h-[38px] hover:bg-elevated transition-colors cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
          isOpen && "ring-2 ring-brand border-transparent",
          className
        )}
      >
        {label && (
          <span className="text-[11px] font-semibold tracking-wide uppercase text-secondary">
            {label}
          </span>
        )}
        <span className="text-xs font-medium text-primary">
          {selectedOption?.label}
        </span>
        <ChevronDown className={cn("text-muted transition-transform", isOpen && "rotate-180")} size={14} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-max min-w-[200px] max-w-[300px] bg-canvas border border-subtle rounded-xl shadow-lg z-50 overflow-hidden flex flex-col max-h-[300px]">
          <div className="overflow-y-auto p-1.5 flex flex-col gap-0.5">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors",
                  value === option.value
                    ? "bg-brand/10 text-brand"
                    : "text-primary hover:bg-elevated"
                )}
              >
                <span className="truncate">{option.label}</span>
                {value === option.value && <Check size={14} className="text-brand shrink-0 ml-3" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
