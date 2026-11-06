// Alarma con Web Audio. iOS solo deja sonar audio tras un toque del usuario:
// el contexto se crea y "desbloquea" en el primer toque.
type AC = AudioContext
let ctx: AC | null = null

function getCtx(): AC | null {
  if (ctx) return ctx
  const Ctor = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
    || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  ctx = new Ctor()
  return ctx
}

export function unlockAudio() {
  const c = getCtx()
  if (!c) return
  try {
    if (c.state === 'suspended') c.resume()
    // Un buffer silencioso deja el audio desbloqueado en iOS
    const b = c.createBuffer(1, 1, 22050)
    const s = c.createBufferSource()
    s.buffer = b
    s.connect(c.destination)
    s.start(0)
  } catch (e) {
    /* sin audio */
  }
}

function once() {
  unlockAudio()
  document.removeEventListener('touchend', once, true)
  document.removeEventListener('click', once, true)
}
document.addEventListener('touchend', once, true)
document.addEventListener('click', once, true)

/** Tres pitidos dobles */
export function beep() {
  const c = getCtx()
  if (!c) return
  try {
    if (c.state === 'suspended') c.resume()
    const t0 = c.currentTime + 0.05
    for (let i = 0; i < 6; i++) {
      const t = t0 + i * 0.32 + (i % 2) * -0.1
      const o = c.createOscillator()
      const g = c.createGain()
      o.type = 'square'
      o.frequency.value = i % 2 ? 1046 : 880
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18)
      o.connect(g)
      g.connect(c.destination)
      o.start(t)
      o.stop(t + 0.2)
    }
  } catch (e) {
    /* sin audio */
  }
  try {
    if (navigator.vibrate) navigator.vibrate([300, 150, 300])
  } catch (e) {
    /* sin vibración */
  }
}
