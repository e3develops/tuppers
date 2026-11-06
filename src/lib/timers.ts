// Temporizadores del modo cocina: siguen corriendo aunque cambies de paso o cierres la app
// (se guarda la hora de fin). Al acabar suenan y se quedan avisando hasta que los quitas.
import { computed, ref } from 'vue'
import { state, type Timer } from '../store'
import { beep } from './audio'

export const nowMs = ref(Date.now())
let ringing: ReturnType<typeof setInterval> | null = null

function ring() {
  beep()
  if (!ringing) ringing = setInterval(() => (state.timers.some(t => t.done) ? beep() : stopRinging()), 4000)
}
function stopRinging() {
  if (ringing) clearInterval(ringing)
  ringing = null
}

setInterval(() => {
  nowMs.value = Date.now()
  let fired = false
  for (const t of state.timers) {
    if (!t.done && t.endAt <= nowMs.value) {
      t.done = true
      fired = true
    }
  }
  if (fired) ring()
}, 1000)

export const activeTimers = computed(() => state.timers.slice().sort((a, b) => a.endAt - b.endAt))

export function startTimer(label: string, minutes: number, id = label + '-' + Date.now()) {
  state.timers.push({ id, label, minutes, endAt: Date.now() + minutes * 60000, done: false })
  return id
}

export function timerFor(label: string, minutes: number): Timer | undefined {
  return state.timers.filter(t => t.label === label && t.minutes === minutes)[0]
}

export function removeTimer(id: string) {
  const i = state.timers.findIndex(t => t.id === id)
  if (i >= 0) state.timers.splice(i, 1)
  if (!state.timers.some(t => t.done)) stopRinging()
}

export function remaining(t: Timer): string {
  const s = Math.max(0, Math.round((t.endAt - nowMs.value) / 1000))
  const m = Math.floor(s / 60)
  const ss = s % 60
  return m + ':' + (ss < 10 ? '0' : '') + ss
}
