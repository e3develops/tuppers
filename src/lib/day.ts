// Todo lo que las pantallas necesitan saber "ahora", calculado a partir del estado y la hora
import { computed } from 'vue'
import { DATA, getRecipe } from '../data'
import type { Recipe } from '../data/types'
import { state } from '../store'
import { addDays, fromISO, toISO } from './dates'
import { now } from './now'
import { isPuente, nightWarning, prepCards, prepWeekMonday, semanaCiclo, tupperFor, weekPlan } from './plan'
import { buildShoppingList, type ListItem } from './shopping'

export const todayISO = computed(() => toISO(now.value))
export const today = computed(() => fromISO(todayISO.value))
export const puente = computed(() => isPuente(today.value, state.settings.startDate))
export const cycleWeek = computed(() => semanaCiclo(today.value, state.settings.startDate))
export const tupperToday = computed(() => tupperFor(today.value, state.settings, DATA, getRecipe))
export const night = computed(() => {
  const w = nightWarning(now.value, state.settings, DATA, getRecipe)
  return w && !state.nightDone[todayISO.value] ? w : null
})
export const cards = computed(() => prepCards(now.value, state.settings, DATA, getRecipe))

/** Semana que se compra y se cocina (desde el viernes, la siguiente) */
export const prepMonday = computed(() => prepWeekMonday(today.value))
export const prepWeekISO = computed(() => toISO(prepMonday.value))
export const prepPlan = computed(() => weekPlan(prepMonday.value, state.settings, DATA, getRecipe))

export interface ShoppingView {
  items: ListItem[]
  checked: Record<string, boolean>
  total: number
  done: number
}

const EMPTY = { checked: {} as Record<string, boolean>, manual: [] }

/** Lista de una semana (sin modificar el estado: la semana se crea al marcar algo) */
export function shoppingFor(weekISO: string, recipes: Recipe[]): ShoppingView {
  const ws = state.shopping[weekISO] || EMPTY
  const items = buildShoppingList(recipes, DATA, state.settings.servings, state.pantryHave, ws.manual)
  const done = items.filter(i => ws.checked[i.key]).length
  return { items, checked: ws.checked, total: items.length, done }
}

export const prepShopping = computed(() => {
  const p = prepPlan.value
  return shoppingFor(prepWeekISO.value, p ? [p.plato1, p.plato2] : [])
})

export const startDate = computed(() => fromISO(state.settings.startDate))
export const weekEnd = (monday: Date) => addDays(monday, 5)
