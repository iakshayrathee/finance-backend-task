/**
 * Format a decimal string amount as a localized currency string.
 * Backend always returns amounts as strings (e.g. "1500.00").
 * ALWAYS use parseFloat() — never Number() — to preserve 2dp.
 */
export function formatCurrency(
  amount: string | number,
  currency = 'USD',
  locale   = 'en-US'
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat(locale, {
    style:    'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/** Parse backend decimal string to number safely. */
export function parseCurrency(amount: string): number {
  return parseFloat(amount) || 0;
}
