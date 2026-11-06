import raw from './data.json'
import type { AppData, Recipe } from './types'

export const DATA = raw as AppData

const byId: Record<string, Recipe> = {}
for (const r of DATA.recetas) byId[r.id] = r

export function getRecipe(id: string): Recipe {
  const r = byId[id]
  if (!r) throw new Error(`Receta desconocida: ${id}`)
  return r
}

export function findRecipe(id: string): Recipe | undefined {
  return byId[id]
}
