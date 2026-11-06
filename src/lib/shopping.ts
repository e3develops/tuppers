// Lista de la compra: ingredientes de los 2 platos de la semana (escalados y sumados)
// + productos fijos semanales + despensa ("¿Te queda?"), ordenada por pasillos del Mercadona.
import type { AppData, Ingredient, Recipe, Section, Unit } from '../data/types'
import { SECTION_ORDER } from '../data/types'

export interface ListItem {
  key: string
  name: string
  qty?: number
  unit?: Unit
  section: Section
  /** Producto de despensa: sale en gris con "¿Te queda?" */
  pantry: boolean
  optional: boolean
  note?: string
  /** Recetas en las que se usa (para el detalle) */
  recipes: string[]
  manual?: boolean
}

export interface ManualItem {
  id: string
  name: string
  section: Section
  /** Semana (lunes, AAAA-MM-DD) en que se compró */
  boughtWeek?: string
}

/** Lo añadido a mano sale cada semana hasta que se compra; ya comprado, solo en la semana en que se compró */
export function visibleManual<T extends ManualItem>(items: T[], weekISO: string): T[] {
  return items.filter(m => !m.boughtWeek || m.boughtWeek === weekISO)
}

/** Ingredientes de varias recetas sumados (mismo producto y misma unidad), multiplicados por factor */
export function sumIngredients(groups: { recipe: string; ingredients: Ingredient[] }[], factor = 1): ListItem[] {
  const map: Record<string, ListItem> = {}
  const order: string[] = []
  for (const g of groups) {
    for (const ing of g.ingredients) {
      const key = ing.id + '|' + (ing.unit || '')
      let item = map[key]
      if (!item) {
        item = map[key] = {
          key,
          name: ing.name,
          unit: ing.unit,
          section: ing.section,
          pantry: false,
          optional: !!ing.optional,
          note: ing.note,
          recipes: [],
        }
        order.push(key)
      } else if (!ing.optional) {
        item.optional = false
      }
      if (ing.qty !== undefined) item.qty = (item.qty || 0) + ing.qty * factor
      if (item.recipes.indexOf(g.recipe) < 0) item.recipes.push(g.recipe)
    }
  }
  return order.map(k => map[k])
}

/** Ingredientes de una receta escalados a otro número de raciones */
export function scaleRecipe(recipe: Recipe, raciones: number): Ingredient[] {
  const f = raciones / recipe.tuppers
  return recipe.ingredients.map(i => (i.qty === undefined ? { ...i } : { ...i, qty: i.qty * f }))
}

export function sortItems(items: ListItem[]): ListItem[] {
  return items.slice().sort((a, b) => {
    const s = SECTION_ORDER.indexOf(a.section) - SECTION_ORDER.indexOf(b.section)
    return s !== 0 ? s : a.name.localeCompare(b.name, 'es')
  })
}

/**
 * Lista completa de la semana. `recipes` son los 2 platos (vacío en modo puente),
 * `factor` 1 (solo yo) o 2 (con mi padre), `pantryHave` lo que hay en casa ("Me queda").
 */
export function buildShoppingList(
  recipes: Recipe[],
  data: AppData,
  factor: number,
  pantryHave: Record<string, boolean>,
  manual: ManualItem[] = [],
): ListItem[] {
  const pantryIds: Record<string, string> = {}
  for (const p of data.despensa) pantryIds[p.id] = p.name

  const fromRecipes = sumIngredients(recipes.map(r => ({ recipe: r.id, ingredients: r.ingredients })), factor)
  const fixed = sumIngredients([{ recipe: 'fijos', ingredients: data.productosFijos.map(p => ({ ...p })) }], factor)

  const items: ListItem[] = []
  // Despensa: una sola línea por producto, con la cantidad que piden las recetas (si la hay)
  const pantry: Record<string, ListItem> = {}
  for (const p of data.despensa) {
    pantry[p.id] = { key: 'despensa|' + p.id, name: p.name, section: 'Despensa', pantry: true, optional: false, recipes: [] }
  }
  for (const it of fromRecipes) {
    const id = it.key.split('|')[0]
    if (pantryIds[id] !== undefined) {
      const p = pantry[id]
      if (it.qty !== undefined) {
        // Si hay varias unidades (p. ej. ml y cdas), se queda la primera con cantidad
        if (p.qty === undefined || p.unit === it.unit) {
          p.qty = (p.qty || 0) + it.qty
          p.unit = it.unit
        }
      }
      for (const r of it.recipes) if (p.recipes.indexOf(r) < 0) p.recipes.push(r)
    } else {
      items.push(it)
    }
  }
  for (const it of fixed) {
    const same = items.filter(x => x.key === it.key)[0]
    if (same) {
      if (it.qty !== undefined) same.qty = (same.qty || 0) + it.qty
    } else {
      items.push(it)
    }
  }
  for (const id in pantry) if (!pantryHave[id]) items.push(pantry[id])
  for (const m of manual) {
    items.push({ key: 'manual|' + m.id, name: m.name, section: m.section, pantry: false, optional: false, recipes: [], manual: true })
  }
  return sortItems(items)
}
