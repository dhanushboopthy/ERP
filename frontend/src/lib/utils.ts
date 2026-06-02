import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(value: number, decimals: number = 3): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatWeight(weight: number, unit: string = 'kg'): string {
  return `${formatNumber(weight)} ${unit}`;
}

export function formatDate(date: Date | string, format: 'short' | 'long' | 'iso' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  switch (format) {
    case 'long':
      return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).format(d);
    case 'iso':
      return d.toISOString().split('T')[0];
    default:
      return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(d);
  }
}

export function calculateNetWeight(gross: number, tare: number): number {
  return Math.max(0, gross - tare);
}

export function calculateGSTAmount(
  baseAmount: number,
  gstRate: number,
  isInterState: boolean
): { cgst: number; sgst: number; igst: number; total: number } {
  if (isInterState) {
    const igst = baseAmount * (gstRate / 100);
    return { cgst: 0, sgst: 0, igst, total: baseAmount + igst };
  }
  const halfRate = gstRate / 2;
  const cgst = baseAmount * (halfRate / 100);
  const sgst = baseAmount * (halfRate / 100);
  return { cgst, sgst, igst: 0, total: baseAmount + cgst + sgst };
}

export function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  if (num === 0) return 'Zero';

  const convertLessThanHundred = (n: number): string => {
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  };

  const convertLessThanThousand = (n: number): string => {
    if (n < 100) return convertLessThanHundred(n);
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertLessThanHundred(n % 100) : '');
  };

  // Indian numbering system
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  let result = '';
  
  if (rupees >= 10000000) {
    result += convertLessThanThousand(Math.floor(rupees / 10000000)) + ' Crore ';
    num = rupees % 10000000;
  }
  if (rupees >= 100000) {
    result += convertLessThanHundred(Math.floor((rupees % 10000000) / 100000)) + ' Lakh ';
  }
  if (rupees >= 1000) {
    result += convertLessThanHundred(Math.floor((rupees % 100000) / 1000)) + ' Thousand ';
  }
  if (rupees >= 100) {
    result += convertLessThanThousand(rupees % 1000);
  } else if (rupees > 0) {
    result += convertLessThanHundred(rupees % 100);
  }

  result = result.trim() + ' Rupees';
  
  if (paise > 0) {
    result += ' and ' + convertLessThanHundred(paise) + ' Paise';
  }

  return result + ' Only';
}

export function validateGSTIN(gstin: string): boolean {
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin);
}

export function validatePAN(pan: string): boolean {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan);
}

export function getFinancialYear(date: Date = new Date()): string {
  const month = date.getMonth();
  const year = date.getFullYear();
  if (month >= 3) {
    return `${year}-${(year + 1).toString().slice(-2)}`;
  }
  return `${year - 1}-${year.toString().slice(-2)}`;
}

export function generateDocumentNumber(
  prefix: string,
  sequence: number,
  financialYear: string,
  padLength: number = 6
): string {
  return `${prefix}/${financialYear}/${sequence.toString().padStart(padLength, '0')}`;
}

export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function getStateCodeFromGSTIN(gstin: string): string {
  return gstin.substring(0, 2);
}

export function isInterStateTransaction(supplierGSTIN: string, recipientGSTIN: string): boolean {
  return getStateCodeFromGSTIN(supplierGSTIN) !== getStateCodeFromGSTIN(recipientGSTIN);
}

export function formatDistanceToNow(date: Date | string): string {
  const now = new Date();
  const past = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - past.getTime();
  
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return formatDate(past);
}
