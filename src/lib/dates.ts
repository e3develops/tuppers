// Fechas en hora local, sin librerías. Las fechas "de día" se guardan como 'YYYY-MM-DD'.

export type ISODate = string

const pad = (n: number) => (n < 10 ? '0' + n : String(n))

export function toISO(d: Date): ISODate {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}

export function fromISO(s: ISODate): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Medianoche local del mismo día */
export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** Suma días de calendario (seguro con los cambios de hora) */
export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
}

/** Número de día absoluto (para restar fechas sin problemas de horario de verano) */
export function dayNumber(d: Date): number {
  return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000)
}

export function daysBetween(a: Date, b: Date): number {
  return dayNumber(b) - dayNumber(a)
}

/** Lunes de la semana (lunes a domingo) en la que cae la fecha */
export function mondayOf(d: Date): Date {
  const diff = (d.getDay() + 6) % 7
  return addDays(d, -diff)
}

/** El próximo lunes estrictamente después de la fecha */
export function nextMonday(d: Date): Date {
  return addDays(mondayOf(d), 7)
}

export function isMonday(d: Date): boolean {
  return d.getDay() === 1
}

export const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
export const DIAS_CORTOS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

export function formatLong(d: Date): string {
  const dia = DIAS[d.getDay()]
  return dia.charAt(0).toUpperCase() + dia.slice(1) + ' ' + d.getDate() + ' de ' + MESES[d.getMonth()]
}

export function formatShort(d: Date): string {
  return d.getDate() + ' ' + MESES[d.getMonth()].slice(0, 3)
}
