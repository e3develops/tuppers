import { describe, expect, it } from 'vitest'
import { DATA, getRecipe } from '../src/data'
import { fromISO, toISO } from '../src/lib/dates'
import {
  eatOutAdvice,
  isPuente,
  nightWarning,
  prepCards,
  prepWeekMonday,
  semanaCiclo,
  storageFor,
  tupperFor,
  tupperLabels,
  weekPlan,
  weeksSinceStart,
  type Settings,
} from '../src/lib/plan'

const START = '2026-11-09' // lunes
const domingo: Settings = { startDate: START, cookDay: 'domingo', servings: 1 }
const viernes: Settings = { startDate: START, cookDay: 'viernes', servings: 1 }
const at = (iso: string, h = 12, m = 0) => {
  const d = fromISO(iso)
  d.setHours(h, m, 0, 0)
  return d
}

describe('semanaCiclo', () => {
  it('la semana del inicio es la 1, de lunes a domingo', () => {
    expect(semanaCiclo(fromISO('2026-11-09'), START)).toBe(1)
    expect(semanaCiclo(fromISO('2026-11-14'), START)).toBe(1) // sábado
    expect(semanaCiclo(fromISO('2026-11-15'), START)).toBe(1) // domingo
  })
  it('avanza 1 → 2 → 3 → 1', () => {
    expect(semanaCiclo(fromISO('2026-11-16'), START)).toBe(2)
    expect(semanaCiclo(fromISO('2026-11-23'), START)).toBe(3)
    expect(semanaCiclo(fromISO('2026-11-30'), START)).toBe(1)
    expect(semanaCiclo(fromISO('2026-12-07'), START)).toBe(2)
  })
  it('sigue bien muchos meses después y con el cambio de hora', () => {
    // 2027-03-28 cambio de hora en España; 20 semanas después del inicio
    expect(weeksSinceStart(fromISO('2027-03-29'), START)).toBe(20)
    expect(semanaCiclo(fromISO('2027-03-29'), START)).toBe(((20 % 3) + 1))
    expect(semanaCiclo(fromISO('2027-11-08'), START)).toBe(((52 % 3) + 1))
  })
  it('antes del inicio no hay semana (modo puente)', () => {
    expect(semanaCiclo(fromISO('2026-11-08'), START)).toBeNull()
    expect(semanaCiclo(fromISO('2026-11-02'), START)).toBeNull()
    expect(isPuente(fromISO('2026-11-08'), START)).toBe(true)
    expect(isPuente(fromISO('2026-11-09'), START)).toBe(false)
  })
})

describe('semana que se compra y se cocina', () => {
  it('de lunes a jueves, la semana en curso', () => {
    expect(toISO(prepWeekMonday(fromISO('2026-11-16')))).toBe('2026-11-16') // lunes
    expect(toISO(prepWeekMonday(fromISO('2026-11-19')))).toBe('2026-11-16') // jueves
  })
  it('desde el viernes, la semana siguiente', () => {
    expect(toISO(prepWeekMonday(fromISO('2026-11-20')))).toBe('2026-11-23') // viernes
    expect(toISO(prepWeekMonday(fromISO('2026-11-21')))).toBe('2026-11-23') // sábado
    expect(toISO(prepWeekMonday(fromISO('2026-11-22')))).toBe('2026-11-23') // domingo
  })
  it('un viernes, la compra es de la semana siguiente del ciclo', () => {
    const plan = weekPlan(prepWeekMonday(fromISO('2026-11-13')), domingo, DATA, getRecipe)!
    expect(plan.semana).toBe(2)
    expect([plan.plato1.id, plan.plato2.id]).toEqual(['pollo-teriyaki', 'bolonesa'])
  })
  it('el viernes anterior al inicio ya toca comprar la semana 1', () => {
    const plan = weekPlan(prepWeekMonday(fromISO('2026-11-06')), domingo, DATA, getRecipe)!
    expect(plan.semana).toBe(1)
    expect([plan.plato1.id, plan.plato2.id]).toEqual(['contramuslos', 'garbanzos-chorizo'])
  })
})

describe('tupper de cada día', () => {
  it('intercala plato 1 y plato 2 de lunes a sábado', () => {
    const platos = ['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14'].map(
      d => tupperFor(fromISO(d), domingo, DATA, getRecipe)!.plato,
    )
    expect(platos).toEqual([1, 2, 1, 2, 1, 2])
    expect(tupperFor(fromISO('2026-11-09'), domingo, DATA, getRecipe)!.recipe.id).toBe('contramuslos')
    expect(tupperFor(fromISO('2026-11-10'), domingo, DATA, getRecipe)!.recipe.id).toBe('garbanzos-chorizo')
  })
  it('el domingo y en modo puente no hay tupper', () => {
    expect(tupperFor(fromISO('2026-11-15'), domingo, DATA, getRecipe)).toBeNull()
    expect(tupperFor(fromISO('2026-11-07'), domingo, DATA, getRecipe)).toBeNull()
  })
  it('cocinando el domingo: L-X nevera, J-S y extra congelador', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(i => storageFor(i, 'domingo'))).toEqual([
      'nevera', 'nevera', 'nevera', 'congelador', 'congelador', 'congelador', 'congelador',
    ])
  })
  it('cocinando el viernes: los 7 al congelador', () => {
    expect([0, 1, 2, 3, 4, 5, 6].every(i => storageFor(i, 'viernes') === 'congelador')).toBe(true)
  })
  it('etiquetas de "Reparte así"', () => {
    const l = tupperLabels('domingo')
    expect(l).toHaveLength(7)
    expect(l[0]).toEqual({ day: 'LUN', plato: 1, storage: 'nevera', extra: false })
    expect(l[6]).toEqual({ day: 'EXTRA', plato: 2, storage: 'congelador', extra: true })
    expect(tupperLabels('viernes').every(x => x.storage === 'congelador')).toBe(true)
  })
  it('"Hoy como fuera"', () => {
    expect(eatOutAdvice('nevera')).toBe('congelar')
    expect(eatOutAdvice('congelador')).toBe('cena')
  })
})

describe('aviso nocturno', () => {
  const noches = (s: Settings) =>
    ['2026-11-15', '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21'].filter(
      d => nightWarning(at(d, 20), s, DATA, getRecipe) !== null,
    )
  it('cocinando el domingo: miércoles, jueves y viernes', () => {
    expect(noches(domingo)).toEqual(['2026-11-18', '2026-11-19', '2026-11-20'])
  })
  it('cocinando el viernes: de domingo a viernes', () => {
    expect(noches(viernes)).toEqual(['2026-11-15', '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20'])
  })
  it('solo a partir de las 19:00', () => {
    expect(nightWarning(at('2026-11-18', 18, 59), domingo, DATA, getRecipe)).toBeNull()
    const w = nightWarning(at('2026-11-18', 19, 0), domingo, DATA, getRecipe)!
    expect(w.plato).toBe(2)
    expect(w.recipe.id).toBe('bolonesa') // jueves 19-nov = semana 2, plato 2
  })
  it('la noche antes del primer lunes (cocinando el viernes) ya avisa', () => {
    expect(nightWarning(at('2026-11-08', 20), viernes, DATA, getRecipe)!.recipe.id).toBe('contramuslos')
  })
})

describe('avisos de preparación', () => {
  const kinds = (iso: string, s: Settings) => prepCards(at(iso), s, DATA, getRecipe).map(c => c.kind)
  it('viernes: compra (y cocinar si cocino el viernes)', () => {
    expect(kinds('2026-11-13', domingo)).toEqual(['compra'])
    expect(kinds('2026-11-13', viernes)).toEqual(['compra', 'cocinar-hoy'])
  })
  it('cocinando el domingo: el sábado "mañana cocinas" y el domingo "hoy cocinas"', () => {
    expect(kinds('2026-11-14', domingo)).toEqual(['cocinar-manana'])
    expect(kinds('2026-11-15', domingo)).toEqual(['cocinar-hoy'])
    expect(kinds('2026-11-14', viernes)).toEqual([])
  })
  it('entre semana no hay avisos de preparación', () => {
    expect(kinds('2026-11-11', domingo)).toEqual([])
  })
})
