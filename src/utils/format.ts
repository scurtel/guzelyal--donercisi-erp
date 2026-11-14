// Turkish formatting & financial math utilities for Güzelyalı ERP

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0,00 ₺';
  }
  const formatted = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} ₺`;
}

export function formatNumber(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '%0';
  }
  return `%${formatNumber(value, decimals)}`;
}

export function formatDate(dateStrOrObj: string | Date | null | undefined): string {
  if (!dateStrOrObj) return '-';
  const d = typeof dateStrOrObj === 'string' ? new Date(dateStrOrObj) : dateStrOrObj;
  if (isNaN(d.getTime())) return String(dateStrOrObj);
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

export function formatDateTime(dateStrOrObj: string | Date | null | undefined): string {
  if (!dateStrOrObj) return '-';
  const d = typeof dateStrOrObj === 'string' ? new Date(dateStrOrObj) : dateStrOrObj;
  if (isNaN(d.getTime())) return String(dateStrOrObj);
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${mins}`;
}

export function formatTime(dateStrOrObj: string | Date | null | undefined): string {
  if (!dateStrOrObj) return '-';
  const d = typeof dateStrOrObj === 'string' ? new Date(dateStrOrObj) : dateStrOrObj;
  if (isNaN(d.getTime())) return '';
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${mins}`;
}

export function formatUnit(amount: number, unit: string): string {
  if (unit === 'kg') {
    if (amount < 1 && amount > 0) {
      return `${Math.round(amount * 1000)} g`;
    }
    return `${formatNumber(amount, 2)} kg`;
  }
  if (unit === 'gram') {
    return `${Math.round(amount)} g`;
  }
  if (unit === 'litre') {
    return `${formatNumber(amount, 2)} L`;
  }
  return `${formatNumber(amount, 0)} ${unit}`;
}

export function parseTrNumber(str: string | number): number {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  // Replace Turkish dots (thousand separators) and comma (decimal separator)
  const clean = str.replace(/\s/g, '').replace(/\./g, '').replace(',', '.').replace('₺', '').replace('%', '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}

// Financial-safe rounding to prevent 0.1 + 0.2 = 0.30000000000000004 floating point errors
export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function roundPrecision(amount: number, decimals = 4): number {
  const factor = Math.pow(10, decimals);
  return Math.round((amount + Number.EPSILON) * factor) / factor;
}
