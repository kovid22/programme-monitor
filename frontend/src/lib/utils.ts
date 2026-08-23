import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrencyValue(valInLakhs: number): string {
  if (valInLakhs > 99) {
    const inCrores = valInLakhs / 100;
    return `₹${inCrores.toLocaleString('en-IN', { maximumFractionDigits: 1 })}Cr`;
  }
  return `₹${valInLakhs.toLocaleString('en-IN', { maximumFractionDigits: 1 })}L`;
}
