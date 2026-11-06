// Alarma de los temporizadores.
// En iOS el interruptor de silencio calla el Web Audio, pero no un <audio> normal: por eso la
// alarma es un WAV generado aquí mismo y reproducido con un elemento <audio>. Si eso falla,
// se usa Web Audio. iOS solo deja reproducir sonido tras un toque: se "desbloquea" en el primero.

let alarm: HTMLAudioElement | null = null
let unlocked = false

/** WAV de 2 s con tres pitidos dobles (PCM 16 bits, mono, 22 050 Hz) */
function makeAlarmWav(): string {
  const rate = 22050
  const secs = 2
  const n = rate * secs
  const buf = new ArrayBuffer(44 + n * 2)
  const v = new DataView(buf)
  const str = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i))
  }
  str(0, 'RIFF')
  v.setUint32(4, 36 + n * 2, true)
  str(8, 'WAVE')
  str(12, 'fmt ')
  v.setUint32(16, 16, true)
  v.setUint16(20, 1, true)
  v.setUint16(22, 1, true)
  v.setUint32(24, rate, true)
  v.setUint32(28, rate * 2, true)
  v.setUint16(32, 2, true)
  v.setUint16(34, 16, true)
  str(36, 'data')
  v.setUint32(40, n * 2, true)
  // Pitidos: [inicio s, duración s, frecuencia]
  const beeps: [number, number, number][] = []
  for (let k = 0; k < 3; k++) {
    beeps.push([k * 0.62, 0.18, 880])
    beeps.push([k * 0.62 + 0.22, 0.18, 1046])
  }
  for (let i = 0; i < n; i++) {
    const t = i / rate
    let s = 0
    for (const [b, d, f] of beeps) {
      if (t >= b && t < b + d) {
        const env = Math.min(1, (t - b) / 0.01, (b + d - t) / 0.02)
        s = Math.sin(2 * Math.PI * f * t) * 0.6 * env
        // un poco de armónico para que se oiga más en el altavoz del móvil
        s += Math.sin(4 * Math.PI * f * t) * 0.15 * env
      }
    }
    v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, s)) * 32767, true)
  }
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }))
}

function getAlarm(): HTMLAudioElement | null {
  if (alarm) return alarm
  try {
    alarm = new Audio(makeAlarmWav())
    alarm.preload = 'auto'
  } catch (e) {
    alarm = null
  }
  return alarm
}

// ---- Web Audio de respaldo ----
type AC = AudioContext
let ctx: AC | null = null
function getCtx(): AC | null {
  if (ctx) return ctx
  const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }
  const Ctor = w.AudioContext || w.webkitAudioContext
  if (!Ctor) return null
  ctx = new Ctor()
  return ctx
}
function webBeep() {
  const c = getCtx()
  if (!c) return
  try {
    if (c.state === 'suspended') c.resume()
    const t0 = c.currentTime + 0.05
    for (let i = 0; i < 6; i++) {
      const t = t0 + Math.floor(i / 2) * 0.62 + (i % 2) * 0.22
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
}

/** Llamar dentro de un toque del usuario (deja el sonido listo para cuando acabe un temporizador) */
export function unlockAudio() {
  try {
    // Safari 17+: que el sonido salga aunque el móvil esté en silencio
    const nav = navigator as unknown as { audioSession?: { type: string } }
    if (nav.audioSession) nav.audioSession.type = 'playback'
  } catch (e) {
    /* no disponible */
  }
  const a = getAlarm()
  if (a && !unlocked) {
    a.muted = true
    const p = a.play()
    const done = () => {
      a.pause()
      a.currentTime = 0
      a.muted = false
      unlocked = true
    }
    if (p && typeof p.then === 'function') p.then(done, () => (a.muted = false))
    else done()
  }
  const c = getCtx()
  if (c) {
    try {
      if (c.state === 'suspended') c.resume()
      const b = c.createBuffer(1, 1, 22050)
      const s = c.createBufferSource()
      s.buffer = b
      s.connect(c.destination)
      s.start(0)
    } catch (e) {
      /* sin audio */
    }
  }
}

function once() {
  unlockAudio()
  document.removeEventListener('touchend', once, true)
  document.removeEventListener('click', once, true)
}
document.addEventListener('touchend', once, true)
document.addEventListener('click', once, true)

/** Suena la alarma (y vibra donde se pueda) */
export function beep() {
  const a = getAlarm()
  let played = false
  if (a) {
    try {
      a.currentTime = 0
      const p = a.play()
      played = true
      if (p && typeof p.catch === 'function') p.catch(() => webBeep())
    } catch (e) {
      played = false
    }
  }
  if (!played) webBeep()
  try {
    if (navigator.vibrate) navigator.vibrate([300, 150, 300])
  } catch (e) {
    /* sin vibración */
  }
}
