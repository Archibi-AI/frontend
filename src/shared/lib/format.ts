/** Date-only strings ("2026-11-20") are shown as the same calendar day in every timezone. */
export function formatDate(value: string | null | undefined, locale = "en-CA"): string {
  if (!value) return "";
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(dateOnly ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: dateOnly ? "UTC" : undefined }).format(date);
}

export const pluralize = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
