/**
 * SUDHAN TEXTILE ERP - DATA FORMATTING UTILITIES
 * Centralized formatting functions for consistent display across the application
 */

/**
 * Format weight with 3 decimal places
 * @param value - Weight value in kg
 * @param unit - Unit to append (default: 'kg')
 */
export function formatWeight(value: number | null | undefined, unit: string = 'kg'): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.000 ' + unit;
  }
  return `${value.toFixed(3)} ${unit}`;
}

/**
 * Format currency with ₹ symbol and 2 decimal places
 * @param value - Currency value
 * @param showSymbol - Whether to show ₹ symbol
 */
export function formatCurrency(value: number | null | undefined, showSymbol: boolean = true): string {
  if (value === null || value === undefined || isNaN(value)) {
    return showSymbol ? '₹0.00' : '0.00';
  }
  
  const formatted = value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return showSymbol ? `₹${formatted}` : formatted;
}

/**
 * Format number with specified decimal places
 * @param value - Number value
 * @param decimals - Number of decimal places (default: 2)
 */
export function formatNumber(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format integer (no decimals)
 * @param value - Integer value
 */
export function formatInteger(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  return Math.round(value).toLocaleString('en-IN');
}

/**
 * Format date to Indian format (DD/MM/YYYY)
 * @param date - Date string or Date object
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch {
    return '-';
  }
}

/**
 * Format date to display format (e.g., "24 Dec 2025")
 * @param date - Date string or Date object
 */
export function formatDateLong(date: string | Date | null | undefined): string {
  if (!date) return '-';
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
}

/**
 * Format date and time
 * @param date - Date string or Date object
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

/**
 * Format time only
 * @param date - Date string or Date object
 */
export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

/**
 * Format percentage
 * @param value - Percentage value (0-100)
 * @param decimals - Number of decimal places
 */
export function formatPercentage(value: number | null | undefined, decimals: number = 1): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format document number (e.g., "YR/24-25/00001")
 * @param prefix - Document prefix
 * @param fyCode - Financial year code
 * @param number - Document number
 */
export function formatDocNumber(prefix: string, fyCode: string, number: number): string {
  return `${prefix}/${fyCode}/${String(number).padStart(5, '0')}`;
}

/**
 * Parse formatted currency back to number
 * @param value - Formatted currency string
 */
export function parseCurrency(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/[₹,\s]/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * Parse formatted number back to number
 * @param value - Formatted number string
 */
export function parseFormattedNumber(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/[,\s]/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * Validate and format input as decimal
 * @param value - Input value
 * @param decimals - Maximum decimal places
 */
export function validateDecimalInput(value: string, decimals: number = 3): string {
  // Remove all non-numeric characters except decimal point
  let cleaned = value.replace(/[^\d.]/g, '');
  
  // Ensure only one decimal point
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Limit decimal places
  if (parts.length === 2 && parts[1].length > decimals) {
    cleaned = parts[0] + '.' + parts[1].slice(0, decimals);
  }
  
  return cleaned;
}

/**
 * Format file size
 * @param bytes - File size in bytes
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 */
export function truncateText(text: string, maxLength: number = 50): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Get relative time (e.g., "2 hours ago")
 * @param date - Date string or Date object
 */
export function getRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    
    const seconds = Math.floor((new Date().getTime() - d.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    
    return formatDate(d);
  } catch {
    return '-';
  }
}

/**
 * Format phone number (Indian format)
 * @param phone - Phone number
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '-';
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  
  return phone;
}

/**
 * Format GST number
 * @param gst - GST number
 */
export function formatGST(gst: string | null | undefined): string {
  if (!gst) return '-';
  
  const cleaned = gst.replace(/\s/g, '').toUpperCase();
  
  if (cleaned.length === 15) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 12)} ${cleaned.slice(12)}`;
  }
  
  return gst;
}
