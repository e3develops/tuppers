import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
import { DATA, findRecipe } from '../src/data'
import { SECTION_ORDER } from '../src/data/types'

// La palabra prohibida se construye por partes para que este test no la contenga
const FORBIDDEN = ['micro', 'ondas'].join('')

function files(dir: string): string[] {
  return readdirSync(dir).flatMap(f => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? files(p) : [p]
  })
}

describe('datos', () => {
  it('el ciclo apunta a recetas que existen', () => {
    for (const w of ['1', '2', '3'] as const) {
      expect(findRecipe(DATA.ciclo[w].plato1)?.type).toBe('horno')
      expect(findRecipe(DATA.ciclo[w].plato2)?.type).toBe('salsa')
    }
    expect(findRecipe(DATA.comodin)?.type).toBe('comodin')
  })
  it('horno da 3 tuppers y salsa 4', () => {
    for (const r of DATA.recetas) {
      if (r.type === 'horno') expect(r.tuppers).toBe(3)
      if (r.type === 'salsa') expect(r.tuppers).toBe(4)
    }
  })
  it('todas las secciones son del Mercadona', () => {
    const all = [...DATA.recetas.flatMap(r => r.ingredients), ...DATA.productosFijos]
    for (const i of all) expect(SECTION_ORDER).toContain(i.section)
  })
  it('los planes de cocina usan recetas de su semana y acaban enfriando', () => {
    for (const w of ['1', '2', '3'] as const) {
      const ids = [DATA.ciclo[w].plato1, DATA.ciclo[w].plato2]
      const plan = DATA.planes[w]
      for (const s of plan.steps) if (s.recipe) expect(ids).toContain(s.recipe)
      expect(plan.steps[plan.steps.length - 1].text).toMatch(/^Enfría/)
    }
  })
  it(`no aparece la palabra prohibida en ninguna parte de la app`, () => {
    const src = files(join(ROOT, 'src')).concat([join(ROOT, 'index.html')])
    for (const f of src) expect(readFileSync(f, 'utf8').toLowerCase()).not.toContain(FORBIDDEN)
  })
  it('no se usan APIs que fallan en Safari antiguo', () => {
    const src = files(join(ROOT, 'src')).filter(f => /\.(ts|vue|css)$/.test(f))
    for (const f of src) {
      const t = readFileSync(f, 'utf8')
      expect(t, f).not.toMatch(/structuredClone|\.at\(|:has\(|@container|\bdvh\b/)
    }
  })
})
