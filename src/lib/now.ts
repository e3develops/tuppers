// "Ahora" reactivo (se refresca cada 30 s). Para probar otro día/hora:
//   …/tuppers/?fecha=2026-11-18T20:00#/
import { ref } from 'vue'

function override(): number | null {
  try {
    const f = new URLSearchParams(location.search).get('fecha')
    if (!f) return null
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(f)
    if (!m) return null
    const d = new Date(+m[1], +m[2] - 1, +m[3], m[4] ? +m[4] : 12, m[5] ? +m[5] : 0)
    return d.getTime() - Date.now()
  } catch (e) {
    return null
  }
}

const offset = override() || 0
export const isTimeTravel = offset !== 0

const current = () => new Date(Date.now() + offset)
export const now = ref<Date>(current())
setInterval(() => (now.value = current()), 30 * 1000)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) now.value = current()
})
