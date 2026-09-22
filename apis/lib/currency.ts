export function formatCurrency(valueCents: number) {
  const value = valueCents / 100;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value);
}

export function formatCurrencyValue(valueCents: number) {
  const value = valueCents / 100;
  return new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
