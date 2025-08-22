/**
 * Utility functions for safe formatting of numbers, dates, and currency
 */

/**
 * Safely formats a number as currency with locale string
 * @param value - The number to format (can be null, undefined, or NaN)
 * @param currency - Currency code (default: 'USD')
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted currency string or fallback value
 */
export function formatCurrency(
  value: number | null | undefined, 
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '$0.00';
  }
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(value);
  } catch (error) {
    // Fallback if Intl.NumberFormat fails
    return `$${Number(value).toFixed(2)}`;
  }
}

/**
 * Safely formats a number with locale string
 * @param value - The number to format (can be null, undefined, or NaN)
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted number string or fallback value
 */
export function formatNumber(
  value: number | null | undefined,
  locale: string = 'en-US'
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  
  try {
    return Number(value).toLocaleString(locale);
  } catch (error) {
    // Fallback if toLocaleString fails
    return String(value);
  }
}

/**
 * Safely formats a date with locale string
 * @param value - The date to format (can be null, undefined, string, or Date)
 * @param options - Intl.DateTimeFormat options
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted date string or fallback value
 */
export function formatDate(
  value: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  },
  locale: string = 'en-US'
): string {
  if (!value) {
    return '—';
  }
  
  try {
    const date = typeof value === 'string' ? new Date(value) : value;
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '—';
    }
    
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch (error) {
    // Fallback if formatting fails
    return '—';
  }
}

/**
 * Safely formats a datetime with locale string
 * @param value - The datetime to format (can be null, undefined, string, or Date)
 * @param options - Intl.DateTimeFormat options
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted datetime string or fallback value
 */
export function formatDateTime(
  value: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  },
  locale: string = 'en-US'
): string {
  if (!value) {
    return '—';
  }
  
  try {
    const date = typeof value === 'string' ? new Date(value) : value;
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '—';
    }
    
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch (error) {
    // Fallback if formatting fails
    return '—';
  }
}

/**
 * Formats a percentage value safely
 * @param value - The number to format as percentage
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export function formatPercentage(
  value: number | null | undefined,
  decimals: number = 1
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  
  return `${Number(value).toFixed(decimals)}%`;
}

/**
 * Formats a compact number (e.g., 1.2K, 3.4M)
 * @param value - The number to format
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted compact number string
 */
export function formatCompactNumber(
  value: number | null | undefined,
  locale: string = 'en-US'
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  
  try {
    return new Intl.NumberFormat(locale, {
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  } catch (error) {
    // Fallback for older browsers
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return String(value);
  }
}

/**
 * Safe alias for formatCurrency with $ prefix
 * @param value - The number to format
 * @returns Formatted currency string with $ prefix
 */
export function formatDollar(value: number | null | undefined): string {
  return formatCurrency(value, 'USD');
}
