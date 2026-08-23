import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrencyParts(valInLakhs: number): { value: string; unit: string } {
  const absVal = Math.abs(valInLakhs);
  if (absVal >= 100) {
    return {
      value: (valInLakhs / 100).toLocaleString('en-IN', { maximumFractionDigits: 1 }),
      unit: 'Cr'
    };
  }
  return {
    value: valInLakhs.toLocaleString('en-IN', { maximumFractionDigits: 1 }),
    unit: 'L'
  };
}

export function formatCurrencyValue(valInLakhs: number): string {
  const parts = formatCurrencyParts(valInLakhs);
  return `₹${parts.value} ${parts.unit}`;
}
