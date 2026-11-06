// Todo lo que las pantallas necesitan saber "ahora", calculado a partir del estado y la hora
import { computed } from 'vue'
import { DATA, getRecipe } from '../data'
import type { Recipe } from '../data/types'
import { state } from '../store'
import { addDays, fromISO, mondayOf, toISO } from './dates'
import { now } from './now'
import {
  isPuente,
  nightWarning,
  prepCards,
  prepWeekMonday,
  semanaCiclo,
  tupperFor,
  weekPlan,
  type CycleWeek,
  type PrepCard,
  type Settings,
} from './plan'
import { buildShoppingList, visibleManual, type ListItem } from './shopping'

/**
 * Ajustes con los que se cocinó la semana de esa fecha: si cambias el día de cocinar a mitad
 * de semana, los tuppers ya hechos siguen donde los guardaste.
 */
export function settingsFor(date: Date): Settings {
  const cookedWith = state.cooked[toISO(mondayOf(date))]
  return cookedWith ? { ...state.settings, cookDay: cookedWith } : state.settings
}

export const todayISO = computed(() => toISO(now.value))
export const today = computed(() => fromISO(todayISO.value))
export const yesterdayISO = computed(() => toISO(addDays(today.value, -1)))
export const puente = computed(() => isPuente(today.value, state.settings.startDate))
export const cycleWeek = computed(() => semanaCiclo(today.value, state.settings.startDate))
export const tupperToday = computed(() => tupperFor(today.value, settingsFor(today.value), DATA, getRecipe))
export const night = computed(() => {
  const w = nightWarning(now.value, settingsFor(addDays(today.value, 1)), DATA, getRecipe)
  return w && !state.nightDone[todayISO.value] ? w : null
})

/** Semana que se compra y se cocina (desde el viernes, la siguiente) */
export const prepMonday = computed(() => prepWeekMonday(today.value))
export const prepWeekISO = computed(() => toISO(prepMonday.value))
export const prepPlan = computed(() => weekPlan(prepMonday.value, state.settings, DATA, getRecipe))
export const prepCooked = computed(() => !!state.cooked[prepWeekISO.value])

export type DayCard = PrepCard | { kind: 'cocinar-pendiente'; semana: CycleWeek; monday: Date }

export const cards = computed<DayCard[]>(() => {
  const out: DayCard[] = prepCards(now.value, state.settings, DATA, getRecipe).filter(
    c => c.kind === 'compra' || !state.cooked[toISO(c.monday)],
  )
  // Cocinas el viernes pero el fin de semana aún no has cocinado la semana que viene
  const dow = today.value.getDay()
  const p = prepPlan.value
  if (p && state.settings.cookDay === 'viernes' && (dow === 6 || dow === 0) && !prepCooked.value) {
    out.push({ kind: 'cocinar-pendiente', semana: p.semana, monday: p.monday })
  }
  return out
})

/** Si ayer comiste fuera y el tupper quedó para cenar */
export const dinnerFromYesterday = computed(() => {
  if (state.eatOut[yesterdayISO.value] !== 'cena') return null
  return tupperFor(fromISO(yesterdayISO.value), settingsFor(fromISO(yesterdayISO.value)), DATA, getRecipe)
})

export interface ShoppingView {
  items: ListItem[]
  checked: Record<string, boolean>
  /** Productos a comprar (la despensa "¿Te queda?" no cuenta) */
  total: number
  done: number
}

/** Lista de una semana (sin modificar el estado: la semana se crea al marcar algo) */
export function shoppingFor(weekISO: string, recipes: Recipe[]): ShoppingView {
  const ws = state.shopping[weekISO]
  const manual = visibleManual(state.manualItems, weekISO)
  const items = buildShoppingList(recipes, DATA, state.settings.servings, state.pantryHave, manual)
  const checked: Record<string, boolean> = {}
  if (ws) for (const k in ws.checked) checked[k] = ws.checked[k]
  for (const m of manual) if (m.boughtWeek === weekISO) checked['manual|' + m.id] = true
  const toBuy = items.filter(i => !i.pantry)
  return { items, checked, total: toBuy.length, done: toBuy.filter(i => checked[i.key]).length }
}

export const prepShopping = computed(() => {
  const p = prepPlan.value
  return shoppingFor(prepWeekISO.value, p ? [p.plato1, p.plato2] : [])
})

export const startDate = computed(() => fromISO(state.settings.startDate))
export const weekEnd = (monday: Date) => addDays(monday, 5)

export function plural(n: number, one: string, many: string) {
  return n + ' ' + (n === 1 ? one : many)
}
