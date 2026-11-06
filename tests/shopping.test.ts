import { describe, expect, it } from 'vitest'
import { DATA, getRecipe } from '../src/data'
import { SECTION_ORDER } from '../src/data/types'
import { formatQty, roundQty } from '../src/lib/qty'
import { buildShoppingList, scaleRecipe, sumIngredients } from '../src/lib/shopping'

const semana1 = [getRecipe('contramuslos'), getRecipe('garbanzos-chorizo')]
const byName = (items: ReturnType<typeof buildShoppingList>, name: string) => items.filter(i => i.name === name)

describe('suma de ingredientes', () => {
  it('suma el mismo producto de los dos platos', () => {
    const items = sumIngredients(semana1.map(r => ({ recipe: r.id, ingredients: r.ingredients })))
    const cebolla = items.filter(i => i.name === 'Cebolla')
    expect(cebolla).toHaveLength(1)
    expect(cebolla[0].qty).toBe(2)
    expect(items.filter(i => i.name === 'Pimiento rojo')[0].qty).toBe(2)
    expect(cebolla[0].recipes).toEqual(['contramuslos', 'garbanzos-chorizo'])
  })
  it('el factor multiplica (con mi padre)', () => {
    const items = sumIngredients(semana1.map(r => ({ recipe: r.id, ingredients: r.ingredients })), 2)
    expect(items.filter(i => i.name === 'Contramuslos de pollo')[0].qty).toBe(2000)
    expect(items.filter(i => i.name === 'Cebolla')[0].qty).toBe(4)
  })
})

describe('lista de la compra', () => {
  it('ordenada por pasillos del Mercadona', () => {
    const items = buildShoppingList(semana1, DATA, 1, {})
    const idx = items.map(i => SECTION_ORDER.indexOf(i.section))
    expect(idx).toEqual(idx.slice().sort((a, b) => a - b))
    expect(items[0].section).toBe('Fruta y verdura')
  })
  it('incluye productos fijos y despensa en gris', () => {
    const items = buildShoppingList(semana1, DATA, 1, {})
    expect(byName(items, 'Huevos')[0].qty).toBe(2)
    expect(byName(items, 'Huevos')[0].unit).toBe('docena')
    const arroz = byName(items, 'Arroz basmati')
    expect(arroz).toHaveLength(1)
    expect(arroz[0].pantry).toBe(true)
    expect(arroz[0].qty).toBe(300)
    expect(byName(items, 'Crema de cacahuete')[0].pantry).toBe(true) // despensa aunque no la pida ninguna receta
    expect(byName(items, 'Aceite de oliva')[0].qty).toBeUndefined()
  })
  it('lo que me queda en casa no sale', () => {
    const items = buildShoppingList(semana1, DATA, 1, { 'arroz-basmati': true, sal: true })
    expect(byName(items, 'Arroz basmati')).toHaveLength(0)
    expect(byName(items, 'Sal')).toHaveLength(0)
    expect(byName(items, 'Miel')).toHaveLength(1)
  })
  it('con mi padre duplica recetas y fijos', () => {
    const items = buildShoppingList(semana1, DATA, 2, {})
    expect(byName(items, 'Contramuslos de pollo')[0].qty).toBe(2000)
    expect(byName(items, 'Huevos')[0].qty).toBe(4)
    expect(byName(items, 'Arroz basmati')[0].qty).toBe(600)
    expect(byName(items, 'Bebida de soja')[0].qty).toBe(4)
  })
  it('el atún de los fijos se suma en una sola línea y el modo puente solo tiene fijos y despensa', () => {
    const items = buildShoppingList([], DATA, 1, {})
    expect(byName(items, 'Atún')).toHaveLength(1)
    expect(byName(items, 'Contramuslos de pollo')).toHaveLength(0)
  })
  it('los productos a mano se añaden en su sección', () => {
    const items = buildShoppingList(semana1, DATA, 1, {}, [{ id: 'x', name: 'Papel de horno', section: 'Otros' }])
    const p = byName(items, 'Papel de horno')[0]
    expect(p.manual).toBe(true)
    expect(items[items.length - 1].section).toBe('Otros')
  })
})

describe('escalado y redondeo', () => {
  it('redondeo legible', () => {
    expect(roundQty(1333.3, 'g')).toBe(1330)
    expect(roundQty(4, 'g')).toBe(10)
    expect(roundQty(1.33, 'ud')).toBe(1)
    expect(roundQty(2.5, 'ud')).toBe(3)
    expect(roundQty(0.2, 'bote')).toBe(1)
    expect(roundQty(1.4, 'cda')).toBe(1.5)
  })
  it('formato', () => {
    expect(formatQty(300, 'g')).toBe('300 g')
    expect(formatQty(2, 'bote')).toBe('2 botes')
    expect(formatQty(1, 'bote')).toBe('1 bote')
    expect(formatQty(1.5, 'cda')).toBe('1½ cdas')
    expect(formatQty(0.5, 'cdta')).toBe('½ cdta')
    expect(formatQty(2, 'L')).toBe('2 L')
    expect(formatQty(undefined)).toBe('')
  })
  it('selector de raciones de la receta', () => {
    const r = getRecipe('contramuslos') // 3 tuppers
    const seis = scaleRecipe(r, 6)
    expect(seis.filter(i => i.id === 'patatas')[0].qty).toBe(1600)
    const cuatro = scaleRecipe(r, 4)
    expect(roundQty(cuatro.filter(i => i.id === 'contramuslos')[0].qty!, 'g')).toBe(1330)
    expect(roundQty(cuatro.filter(i => i.id === 'pimiento-rojo')[0].qty!, 'ud')).toBe(1)
    expect(scaleRecipe(r, 6).filter(i => i.id === 'oregano')[0].qty).toBeUndefined()
  })
})
