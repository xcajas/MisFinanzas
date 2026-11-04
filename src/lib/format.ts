// Formato de moneda y fechas en español (Ecuador, USD).
// Se implementa a mano para no depender del soporte Intl del motor JS en cada dispositivo.

/** $1.234,56 (formato es-EC, igual que el prototipo). Siempre valor absoluto. */
export function fmtUSD(n: number): string {
  const abs = Math.abs(n);
  const [int, dec] = abs.toFixed(2).split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `$${grouped},${dec}`;
}

/** Igual que fmtUSD pero con signo "-" cuando es negativo. */
export function fmtSignedUSD(n: number): string {
  return (n < 0 ? '-' : '') + fmtUSD(n);
}

/** Convierte "12,50" o "12.50" en número. Devuelve NaN si no es válido. */
export function parseAmount(text: string): number {
  const clean = text.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d{0,2})?$/.test(clean)) return NaN;
  return Number(clean);
}

const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
const MONTHS_LONG = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const pad = (n: number) => String(n).padStart(2, '0');

/** Fecha local → "YYYY-MM-DD". */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "YYYY-MM-DD" → Date local (mediodía, para evitar saltos de zona horaria). */
export function fromISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export const todayISO = () => toISODate(new Date());
export const currentMonth = () => todayISO().slice(0, 7);

/** "2026-11" → "nov 2026" */
export function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTHS_SHORT[m - 1]} ${y}`;
}

/** "2026-11" → "Noviembre 2026" */
export function monthLabelLong(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const name = MONTHS_LONG[m - 1];
  return `${name[0].toUpperCase()}${name.slice(1)} ${y}`;
}

/** "2026-11-04" → "04/11/2026" */
export function dateLabel(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** "2026-11-04" → "04/11" (como en la lista del prototipo) */
export function shortDateLabel(iso: string): string {
  return `${iso.slice(8)}/${iso.slice(5, 7)}`;
}

/** Desplaza un mes "YYYY-MM" n meses. */
export function addMonths(ym: string, n: number): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}
