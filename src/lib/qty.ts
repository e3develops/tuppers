// Cantidades: escalado y redondeo legible (unidades enteras, gramos a múltiplos de 10)
import type { Unit } from '../data/types'

const COUNTABLE: Unit[] = ['ud', 'bote', 'lata', 'bolsa', 'paquete', 'docena', 'pack']

export function roundQty(qty: number, unit?: Unit): number {
  if (!unit) return qty
  if (unit === 'g' || unit === 'ml') return Math.max(10, Math.round(qty / 10) * 10)
  if (unit === 'cda' || unit === 'cdta' || unit === 'L') return Math.max(0.5, Math.round(qty * 2) / 2)
  if (COUNTABLE.indexOf(unit) >= 0) return Math.max(1, Math.round(qty))
  return qty
}

const PLURAL: Partial<Record<Unit, [string, string]>> = {
  ud: ['ud', 'uds'],
  bote: ['bote', 'botes'],
  lata: ['lata', 'latas'],
  bolsa: ['bolsa', 'bolsas'],
  paquete: ['paquete', 'paquetes'],
  docena: ['docena', 'docenas'],
  pack: ['pack', 'packs'],
  cda: ['cda', 'cdas'],
  cdta: ['cdta', 'cdtas'],
}

/** "1½" en vez de "1.5" */
function fmtNumber(n: number): string {
  const whole = Math.floor(n)
  const frac = n - whole
  if (Math.abs(frac - 0.5) < 1e-9) return (whole ? String(whole) : '') + '½'
  if (Number.isInteger(n)) return String(n)
  return String(Math.round(n * 10) / 10).replace('.', ',')
}

/** Cantidad lista para mostrar: "300 g", "2 botes", "1½ cdas", "2 L" */
export function formatQty(qty: number | undefined, unit?: Unit): string {
  if (qty === undefined) return ''
  const q = roundQty(qty, unit)
  if (!unit) return fmtNumber(q)
  if (unit === 'g' || unit === 'ml' || unit === 'L') return fmtNumber(q) + ' ' + unit
  const names = PLURAL[unit]
  if (!names) return fmtNumber(q) + ' ' + unit
  return fmtNumber(q) + ' ' + (q > 1 ? names[1] : names[0])
}
