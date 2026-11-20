// Ca in backend: datele si orele sunt in Europe/Bucharest, intervale de 30 min.
export const TZ = 'Europe/Bucharest';
export const SLOT = 30;

const parts = (d: Date) =>
  Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(d)
      .map((p) => [p.type, p.value]),
  );

/** Local "YYYY-MM-DD" and minutes since midnight, in Bucharest. */
export function nowLocal(d = new Date()) {
  const p = parts(d);
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute) };
}

export const today = () => nowLocal().date;

export function addDays(date: string, days: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
export const toEndMinutes = (hhmm: string) => toMinutes(hhmm) || 1440;
export const toHHMM = (min: number) =>
  `${String(Math.floor((min % 1440) / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

const noon = (date: string) => new Date(`${date}T12:00:00Z`);
const fmt = (date: string, o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('ro-RO', { timeZone: 'UTC', ...o }).format(noon(date));
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Joi, 23 octombrie" */
export const longDay = (date: string) =>
  cap(fmt(date, { weekday: 'long' })) + ', ' + fmt(date, { day: 'numeric', month: 'long' });
/** "Joi, 23 oct" */
export const shortDay = (date: string) =>
  cap(fmt(date, { weekday: 'long' })) +
  ', ' +
  fmt(date, { day: 'numeric', month: 'short' }).replace('.', '');
/** "J" pentru bara cu zile */
export const dayLetter = (date: string) => cap(fmt(date, { weekday: 'narrow' }));
export const dayNumber = (date: string) => Number(date.slice(8));

/** "1 oră", "30 min", "1 oră 30 min" */
export function duration(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const hs = h ? (h === 1 ? '1 oră' : `${h} ore`) : '';
  return [hs, m ? `${m} min` : ''].filter(Boolean).join(' ') || '0 min';
}

/** Instantul unei ore locale din Bucuresti, ca ISO (pt mentenanta). */
export function toInstant(date: string, minutes: number) {
  const guess = Date.parse(`${date}T00:00:00Z`) + minutes * 60_000;
  const offset = (t: number) => {
    const l = nowLocal(new Date(t));
    return Date.parse(`${l.date}T00:00:00Z`) + l.minutes * 60_000 - t;
  };
  return new Date(guess - offset(guess - offset(guess))).toISOString();
}
