/**
 * Formats a currency value in MXN using the Intl API
 * @param value - The numeric value in MXN cents (will be divided by 100)
 * @returns A formatted currency string in MXN
 */
export const formatCurrency = (value: number): string => {
  // Convert cents to pesos (divide by 100)
  const pesos = value / 100;

  // Format using Intl API for MXN
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(pesos);
};

/**
 * Formats a large number with thousand separators
 * @param value - The numeric value to format
 * @returns A formatted string with thousand separators
 */
export const formatNumber = (value: number): string => {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Formats currency with thousand separators (fallback when API doesn't provide formatted strings)
 * @param value - The numeric value to format
 * @returns A formatted currency string with thousand separators
 */
export const formatCurrencyWithSeparators = (value: number): string => {
  return `$${formatNumber(value)}`;
};
