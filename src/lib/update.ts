// Nunca usar una versión vieja: al abrir (y al volver a la app) se compara la versión de esta
// copia con version.json publicado. Si hay una más nueva, se limpia la caché y se recarga.
import { registerSW } from 'virtual:pwa-register'

const BASE = import.meta.env.BASE_URL

function latestVersion(): Promise<string | null> {
  const req = fetch(BASE + 'version.json?t=' + Date.now(), { cache: 'no-store' })
    .then(r => (r.ok ? r.json() : null))
    .then(j => (j && j.version) || null)
    .catch(() => null)
  const timeout = new Promise<null>(res => setTimeout(() => res(null), 3500))
  return Promise.race([req, timeout])
}

async function applyUpdate(v: string) {
  try {
    const key = 'tuppers-upd-' + v
    if (sessionStorage.getItem(key)) return // como mucho un intento por versión (sin bucles)
    sessionStorage.setItem(key, '1')
  } catch (e) {
    /* sin sessionStorage */
  }
  try {
    const reg = navigator.serviceWorker && (await navigator.serviceWorker.getRegistration())
    if (reg) await reg.update()
    if (window.caches) {
      const keys = await caches.keys()
      await Promise.all(keys.map(k => caches.delete(k)))
    }
  } catch (e) {
    /* seguimos igualmente */
  }
  location.reload()
}

export function setupUpdates(isBusy: () => boolean) {
  if (!import.meta.env.PROD) return
  registerSW({ immediate: true })
  const check = async () => {
    const v = await latestVersion()
    if (v && v !== __APP_VERSION__ && !isBusy()) applyUpdate(v)
  }
  check()
  let last = Date.now()
  document.addEventListener('visibilitychange', () => {
    if (document.hidden || Date.now() - last < 2 * 60 * 1000) return
    last = Date.now()
    check()
  })
}
