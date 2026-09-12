export function kigaliToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Kigali',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const p = (key: string) => parts.find((x) => x.type === key)!.value;
  return `${p('year')}-${p('month')}-${p('day')}`;
}
export function tomorrowKigali(now = new Date()): string {
  const d = new Date(`${kigaliToday(now)}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
export function isValidDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function isFutureDate(value: string, now = new Date()) {
  return isValidDate(value) && value >= tomorrowKigali(now);
}
