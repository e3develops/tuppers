// Estado del usuario, guardado en localStorage (con valores por defecto si viene vacío o roto)
import { reactive, watch } from 'vue'
import { nextMonday, toISO, type ISODate } from './lib/dates'
import type { Settings } from './lib/plan'
import type { ManualItem } from './lib/shopping'

const KEY = 'tuppers-v1'

export interface Timer {
  id: string
  label: string
  endAt: number
  minutes: number
  done: boolean
}

export interface WeekShopping {
  checked: Record<string, boolean>
  manual: ManualItem[]
}

export interface State {
  onboarded: boolean
  settings: Settings
  /** Productos de despensa que hay en casa ("Me queda") */
  pantryHave: Record<string, boolean>
  /** Compra por semana (clave: lunes de la semana) */
  shopping: Record<ISODate, WeekShopping>
  /** Aviso nocturno marcado como hecho (clave: la noche) */
  nightDone: Record<ISODate, boolean>
  /** "Hoy como fuera" (clave: el día) */
  eatOut: Record<ISODate, 'congelar' | 'cena'>
  /** Días en que se usó un tupper de la reserva */
  reserveUsed: Record<ISODate, boolean>
  reserve: number
  /** Semanas ya cocinadas (para sumar el extra a la reserva una sola vez) */
  cooked: Record<ISODate, boolean>
  timers: Timer[]
  /** Paso por el que va el modo cocina */
  cook: { key: string; step: number } | null
}

export function defaultState(): State {
  return {
    onboarded: false,
    settings: { startDate: toISO(nextMonday(new Date())), cookDay: 'viernes', servings: 1 },
    pantryHave: {},
    shopping: {},
    nightDone: {},
    eatOut: {},
    reserveUsed: {},
    reserve: 0,
    cooked: {},
    timers: [],
    cook: null,
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
    const st: State = Object.assign(base, s)
    st.settings = Object.assign(defaultState().settings, isObj(s.settings) ? s.settings : {})
    for (const k of ['pantryHave', 'shopping', 'nightDone', 'eatOut', 'reserveUsed', 'cooked'] as const) {
      if (!isObj(st[k])) (st as unknown as Record<string, unknown>)[k] = {}
    }
    if (!Array.isArray(st.timers)) st.timers = []
    st.reserve = Math.max(0, Number(st.reserve) || 0)
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

/** Compra de una semana (la crea si no existe) y limpia semanas antiguas */
export function weekShopping(week: ISODate): WeekShopping {
  if (!state.shopping[week]) {
    state.shopping[week] = { checked: {}, manual: [] }
    const keys = Object.keys(state.shopping).sort()
    while (keys.length > 6) delete state.shopping[keys.shift() as string]
  }
  return state.shopping[week]
}
