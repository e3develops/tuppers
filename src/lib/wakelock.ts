// Que la pantalla no se apague en el modo cocina: Wake Lock API si existe y, si no
// (iOS antiguos), NoSleep.js con un vídeo silencioso en bucle. Hay que activarlo tras un toque.
import NoSleep from 'nosleep.js'

let noSleep: NoSleep | null = null

export function keepAwake() {
  try {
    if (!noSleep) noSleep = new NoSleep()
    if (!noSleep.isEnabled) noSleep.enable().catch(() => {})
  } catch (e) {
    /* no disponible: la pantalla podrá apagarse */
  }
}

export function releaseAwake() {
  try {
    if (noSleep && noSleep.isEnabled) noSleep.disable()
  } catch (e) {
    /* nada */
  }
}
