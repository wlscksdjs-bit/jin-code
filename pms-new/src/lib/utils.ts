import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}억`
  }
  return amount.toLocaleString('ko-KR') + '원'
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}
