import { CurrencyCode } from '../types';

/**
 * Format a number with dots as thousands/millions separator (es-PY / standard latin format)
 * e.g. 85000000 -> "85.000.000" (dos puntos entre los 6 ceros)
 */
export function formatNumberWithDots(val: number | string | undefined | null): string {
  if (val === undefined || val === null || val === '') return '';
  const num = typeof val === 'number' ? val : Number(String(val).replace(/[^\d]/g, ''));
  if (isNaN(num) || num === 0) return '';
  return num.toLocaleString('es-PY');
}

/**
 * Parse an input string with dots or raw numbers into a clean integer number
 * e.g. "85.000.000" -> 85000000
 * e.g. "85,000,000" -> 85000000
 * e.g. "85000000"   -> 85000000
 */
export function parseNumberFromFormatted(val: string | number): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const clean = String(val).replace(/[^\d]/g, '');
  return clean ? Number(clean) : 0;
}

/**
 * Returns human-readable description for Guaraníes (PYG) in millions
 * e.g. 85000000 -> "85 Millones (85.000.000 Gs.)"
 */
export function getMillionsDescription(amount: number, currency: CurrencyCode = 'PYG'): string {
  if (!amount || isNaN(amount) || amount <= 0) return '';
  
  if (currency === 'PYG') {
    if (amount >= 1_000_000) {
      const millions = amount / 1_000_000;
      const formattedMillions = Number.isInteger(millions)
        ? millions.toString()
        : millions.toLocaleString('es-PY', { maximumFractionDigits: 2 });
      return `${formattedMillions} Millones (${amount.toLocaleString('es-PY')} Gs. • 2 puntos)`;
    } else if (amount >= 1_000) {
      const thousands = (amount / 1_000).toLocaleString('es-PY', { maximumFractionDigits: 1 });
      return `${thousands} Mil Gs. (${amount.toLocaleString('es-PY')} Gs.)`;
    }
    return `${amount.toLocaleString('es-PY')} Gs.`;
  }

  return `${currency} ${amount.toLocaleString('es-ES')}`;
}
