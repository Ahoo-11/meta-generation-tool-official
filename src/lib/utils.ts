import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistance } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date for display
 * @param date Date to format
 * @param formatString Optional format string
 * @returns Formatted date string
 */
export function formatDate(date: Date, formatString: string = 'MMM d, yyyy'): string {
  return format(date, formatString)
}

/**
 * Format a date as a relative time (e.g., "2 days ago")
 * @param date Date to format
 * @param baseDate Base date to compare against (defaults to now)
 * @returns Formatted relative date string
 */
export function formatRelativeDate(date: Date, baseDate: Date = new Date()): string {
  return formatDistance(date, baseDate, { addSuffix: true })
}

/**
 * Format a currency amount
 * @param amount Amount in smallest currency unit (e.g., cents)
 * @param currency Currency code
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  })
  
  // Convert from cents to dollars if needed
  const value = amount >= 100 ? amount / 100 : amount
  return formatter.format(value)
}
