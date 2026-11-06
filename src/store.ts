// Estado del usuario, guardado en localStorage (con valores por defecto si viene vacío o roto)
import { reactive, watch } from 'vue'
import type { Section } from './data/types'
import { daysBetween, fromISO, nextMonday, toISO, type ISODate } from './lib/dates'
import { now } from './lib/now'
import type { CookDay, EatOut, Settings } from './lib/plan'

const KEY = 'tuppers-v1'

export interface Timer {
  id: string
  label: string
  endAt: number
  minutes: number
  done: boolean
}

/** Producto añadido a mano: sigue en la lista (semana tras semana) hasta que se compra */
export interface ManualEntry {
  id: string
  name: string
  section: Section
  /** Semana (lunes) en que se marcó como comprado */
  boughtWeek?: ISODate
}

export interface State {
  onboarded: boolean
  settings: Settings
  /** Productos de despensa que hay en casa ("Me queda") */
  pantryHave: Record<string, boolean>
  /** Marcados de la compra por semana (clave: lunes de la semana) */
  shopping: Record<ISODate, { checked: Record<string, boolean> }>
  manualItems: ManualEntry[]
  /** Aviso nocturno marcado como hecho (clave: la noche) */
  nightDone: Record<ISODate, boolean>
  /** "Hoy como fuera" (clave: el día) */
  eatOut: Record<ISODate, EatOut>
  /** Tuppers de la reserva usados cada día */
  reserveUsed: Record<ISODate, number>
  reserve: number
  /** Semanas ya cocinadas y con qué día de cocinar (para nevera/congelador y para sumar el extra una sola vez) */
  cooked: Record<ISODate, CookDay>
  timers: Timer[]
  /** Paso por el que va cada modo cocina (la semana o una receta suelta) */
  cookSteps: Record<string, number>
}

export function defaultState(): State {
  return {
    onboarded: false,
    settings: { startDate: toISO(nextMonday(now.value)), cookDay: 'viernes', servings: 1 },
    pantryHave: {},
    shopping: {},
    manualItems: [],
    nightDone: {},
    eatOut: {},
    reserveUsed: {},
    reserve: 0,
    cooked: {},
    timers: [],
    cookSteps: {},
  }
}

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

function load(): State {
  const base = defaultState()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return base
    const s = JSON.parse(raw)
    if (!isObj(s)) return base
    const st = Object.assign(base, s) as State & Record<string, unknown>
    st.settings = Object.assign(defaultState().settings, isObj(s.settings) ? s.settings : {})
    for (const k of ['pantryHave', 'shopping', 'nightDone', 'eatOut', 'reserveUsed', 'cooked', 'cookSteps'] as const) {
      if (!isObj(st[k])) (st as unknown as Record<string, unknown>)[k] = {}
    }
    if (!Array.isArray(st.timers)) st.timers = []
    if (!Array.isArray(st.manualItems)) st.manualItems = []
    st.reserve = Math.max(0, Number(st.reserve) || 0)
    // Datos de la primera versión
    for (const d in st.reserveUsed) st.reserveUsed[d] = Number(st.reserveUsed[d]) || 0
    for (const w in st.cooked) if (st.cooked[w] !== 'viernes' && st.cooked[w] !== 'domingo') st.cooked[w] = st.settings.cookDay
    for (const w in st.shopping) {
      const old = st.shopping[w] as unknown as { manual?: { id: string; name: string; section: Section }[] }
      if (old.manual) {
        for (const m of old.manual) if (!st.manualItems.some(x => x.id === m.id)) st.manualItems.push({ id: m.id, name: m.name, section: m.section })
        delete old.manual
      }
    }
    const oldCook = st.cook
    if (isObj(oldCook) && typeof oldCook.key === 'string') st.cookSteps[oldCook.key] = Number(oldCook.step) || 0
    delete st.cook
    // Lo añadido a mano y ya comprado hace más de 2 meses se olvida
    st.manualItems = st.manualItems.filter(m => !m.boughtWeek || daysBetween(fromISO(m.boughtWeek), now.value) < 60)
    return st
  } catch (e) {
    return base
  }
}

export const state = reactive<State>(load())

let saveTimer: ReturnType<typeof setTimeout> | undefined
watch(
  state,
  () => {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(state))
      } catch (e) {
        /* sin almacenamiento (modo privado): la app sigue funcionando */
      }
    }, 150)
  },
  { deep: true },
)

export function resetState() {
  const fresh = defaultState()
  for (const k of Object.keys(fresh) as (keyof State)[]) {
    ;(state as unknown as Record<string, unknown>)[k] = fresh[k]
  }
}

/** Marcados de una semana (los crea si no existen) y limpia semanas antiguas */
export function weekShopping(week: ISODate) {
  if (!state.shopping[week]) {
    state.shopping[week] = { checked: {} }
    const keys = Object.keys(state.shopping).sort()
    while (keys.length > 6) delete state.shopping[keys.shift() as string]
  }
  return state.shopping[week]
}
