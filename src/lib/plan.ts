// Lógica del calendario: ciclo de 3 semanas, qué tupper toca cada día, dónde se guarda,
// qué semana se compra/cocina y los avisos del día.
import type { AppData, Recipe } from '../data/types'
import { addDays, daysBetween, fromISO, mondayOf, toISO, type ISODate } from './dates'

export type CookDay = 'viernes' | 'domingo'
export type Servings = 1 | 2

export interface Settings {
  /** Lunes en que empieza la semana 1 del ciclo */
  startDate: ISODate
  cookDay: CookDay
  /** 1 = solo yo · 2 = con mi padre (duplica cantidades y tuppers) */
  servings: Servings
}

export type CycleWeek = 1 | 2 | 3
export type Plato = 1 | 2
export type Storage = 'nevera' | 'congelador'

/** Platos intercalados de lunes (0) a sábado (5) */
export const PATTERN: Plato[] = [1, 2, 1, 2, 1, 2]
export const DAY_LABELS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']

/** Semanas completas entre el lunes de inicio y la semana (lunes-domingo) de la fecha */
export function weeksSinceStart(date: Date, startDate: ISODate): number {
  const start = mondayOf(fromISO(startDate))
  return Math.floor(daysBetween(start, mondayOf(date)) / 7)
}

/** Semana del ciclo (1, 2 o 3). null si la fecha es anterior al inicio (modo puente). */
export function semanaCiclo(date: Date, startDate: ISODate): CycleWeek | null {
  const n = weeksSinceStart(date, startDate)
  if (n < 0) return null
  return ((n % 3) + 1) as CycleWeek
}

/** Antes de la fecha de inicio: solo comidas fijas y comodín, sin tuppers */
export function isPuente(date: Date, startDate: ISODate): boolean {
  return daysBetween(fromISO(startDate), date) < 0
}

/** Dónde está cada tupper. dayIdx: 0 = lunes … 5 = sábado, 6 = el extra de reserva */
export function storageFor(dayIdx: number, cookDay: CookDay): Storage {
  if (cookDay === 'viernes') return 'congelador' // del viernes al miércoles son demasiados días en la nevera
  return dayIdx <= 2 ? 'nevera' : 'congelador'
}

export interface WeekPlan {
  monday: Date
  semana: CycleWeek
  plato1: Recipe
  plato2: Recipe
}

export function weekPlan(monday: Date, settings: Settings, data: AppData, getRecipe: (id: string) => Recipe): WeekPlan | null {
  const semana = semanaCiclo(monday, settings.startDate)
  if (!semana) return null
  const c = data.ciclo[String(semana) as '1' | '2' | '3']
  return { monday: mondayOf(monday), semana, plato1: getRecipe(c.plato1), plato2: getRecipe(c.plato2) }
}

export interface TupperOfDay {
  date: ISODate
  dayIdx: number
  plato: Plato
  recipe: Recipe
  storage: Storage
  semana: CycleWeek
}

/** El tupper que toca un día (null en domingo o en modo puente) */
export function tupperFor(date: Date, settings: Settings, data: AppData, getRecipe: (id: string) => Recipe): TupperOfDay | null {
  const dow = date.getDay()
  if (dow === 0) return null
  if (isPuente(date, settings.startDate)) return null
  const plan = weekPlan(mondayOf(date), settings, data, getRecipe)
  if (!plan) return null
  const dayIdx = dow - 1
  const plato = PATTERN[dayIdx]
  return {
    date: toISO(date),
    dayIdx,
    plato,
    recipe: plato === 1 ? plan.plato1 : plan.plato2,
    storage: storageFor(dayIdx, settings.cookDay),
    semana: plan.semana,
  }
}

/**
 * Semana que se compra y se cocina. Desde el viernes (viernes, sábado y domingo) ya es la
 * semana siguiente; de lunes a jueves, la semana en curso (por si falta algo).
 */
export function prepWeekMonday(date: Date): Date {
  const dow = date.getDay()
  if (dow === 5 || dow === 6 || dow === 0) return addDays(mondayOf(date), 7)
  return mondayOf(date)
}

/** Aviso nocturno: desde las 19:00, si el tupper de mañana está en el congelador */
export function nightWarning(now: Date, settings: Settings, data: AppData, getRecipe: (id: string) => Recipe): TupperOfDay | null {
  if (now.getHours() < 19) return null
  const t = tupperFor(addDays(now, 1), settings, data, getRecipe)
  if (!t || t.storage !== 'congelador') return null
  return t
}

export type PrepCard =
  | { kind: 'compra'; semana: CycleWeek; monday: Date }
  | { kind: 'cocinar-hoy'; semana: CycleWeek; monday: Date }
  | { kind: 'cocinar-manana'; semana: CycleWeek; monday: Date; plato1: Recipe; plato2: Recipe; minutes: number }

/** Tarjetas de preparación del día (compra y cocina) */
export function prepCards(now: Date, settings: Settings, data: AppData, getRecipe: (id: string) => Recipe): PrepCard[] {
  const dow = now.getDay()
  const plan = weekPlan(prepWeekMonday(now), settings, data, getRecipe)
  if (!plan) return []
  const base = { semana: plan.semana, monday: plan.monday }
  const cards: PrepCard[] = []
  if (dow === 5) {
    cards.push({ kind: 'compra', ...base })
    if (settings.cookDay === 'viernes') cards.push({ kind: 'cocinar-hoy', ...base })
  }
  if (settings.cookDay === 'domingo') {
    const minutes = data.planes[String(plan.semana) as '1' | '2' | '3'].totalMin
    if (dow === 6) cards.push({ kind: 'cocinar-manana', ...base, plato1: plan.plato1, plato2: plan.plato2, minutes })
    if (dow === 0) cards.push({ kind: 'cocinar-hoy', ...base })
  }
  return cards
}

export interface TupperLabel {
  day: string
  plato: Plato
  storage: Storage
  extra: boolean
}

/** Las 7 etiquetas de "Reparte así" (6 días + el extra de reserva) */
export function tupperLabels(cookDay: CookDay): TupperLabel[] {
  const labels: TupperLabel[] = PATTERN.map((plato, i) => ({ day: DAY_LABELS[i], plato, storage: storageFor(i, cookDay), extra: false }))
  labels.push({ day: 'EXTRA', plato: 2, storage: 'congelador', extra: true })
  return labels
}

export type EatOut = 'congelar' | 'cena' | 'reserva'

/**
 * "Hoy como fuera":
 * - en la nevera sin haberse congelado nunca → al congelador, queda de reserva
 * - venía del congelador y se descongeló anoche → cena en 24 h (no se vuelve a congelar)
 * - venía del congelador y NO se sacó anoche → sigue congelado: se queda de reserva
 */
export function eatOutAdvice(storage: Storage, thawed: boolean): EatOut {
  if (storage === 'nevera') return 'congelar'
  return thawed ? 'cena' : 'reserva'
}
