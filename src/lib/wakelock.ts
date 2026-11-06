// Que la pantalla no se apague en el modo cocina.
// 1) Wake Lock API si existe y funciona (en la app instalada de iOS solo va bien desde iOS 18.4).
// 2) Si no, un vídeo silencioso de 2 s en bucle (truco tipo NoSleep), que iOS trata como
//    "reproduciendo" y no apaga la pantalla. Hay que arrancarlo dentro de un toque.
import { ref } from 'vue'

interface Sentinel {
  release(): Promise<void>
  addEventListener?(t: string, f: () => void): void
}
type WakeLockNav = Navigator & { wakeLock?: { request(type: 'screen'): Promise<Sentinel> } }

/** ¿Está la pantalla bloqueada encendida ahora mismo? */
export const awake = ref(false)

let wanted = false
let sentinel: Sentinel | null = null
let video: HTMLVideoElement | null = null

function startVideo(): Promise<void> {
  if (!video) {
    video = document.createElement('video')
    video.setAttribute('playsinline', '')
    video.setAttribute('webkit-playsinline', '')
    video.setAttribute('muted', '')
    video.setAttribute('aria-hidden', 'true')
    video.muted = true
    video.loop = true
    video.src = import.meta.env.BASE_URL + 'keepawake.mp4'
    video.style.cssText = 'position:fixed;left:0;bottom:0;width:1px;height:1px;opacity:0.01;pointer-events:none;z-index:-1'
    document.body.appendChild(video)
  }
  const p = video.play()
  return p && typeof p.then === 'function' ? p.then(() => { awake.value = true }) : Promise.resolve().then(() => { awake.value = true })
}

function tryNative(): Promise<boolean> {
  const nav = navigator as WakeLockNav
  if (!nav.wakeLock) return Promise.resolve(false)
  return nav.wakeLock
    .request('screen')
    .then(s => {
      sentinel = s
      awake.value = true
      if (s.addEventListener) s.addEventListener('release', () => {
        sentinel = null
        if (!video || video.paused) awake.value = false
      })
      return true
    })
    .catch(() => false)
}

/** Llamar dentro de un toque del usuario */
export function keepAwake() {
  wanted = true
  // El vídeo se arranca ya (dentro del toque) y se deja también aunque la API nativa responda:
  // en la app instalada de iOS anterior a 18.4 la API dice que sí pero la pantalla se apaga igual.
  startVideo().catch(() => {})
  tryNative()
}

export function releaseAwake() {
  wanted = false
  awake.value = false
  if (sentinel) {
    sentinel.release().catch(() => {})
    sentinel = null
  }
  if (video) video.pause()
}

// Al volver a la app, el bloqueo nativo se pierde: se pide otra vez
document.addEventListener('visibilitychange', () => {
  if (document.hidden || !wanted) return
  tryNative()
  if (video) video.play().catch(() => {})
})
