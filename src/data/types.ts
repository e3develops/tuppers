// Tipos del contenido de la app (src/data/data.json)

export type Section =
  | 'Fruta y verdura'
  | 'Carne y pescado'
  | 'Charcutería y huevos'
  | 'Refrigerados'
  | 'Panadería'
  | 'Despensa'
  | 'Congelados'
  | 'Otros'

/** Orden de los pasillos del Mercadona */
export const SECTION_ORDER: Section[] = [
  'Fruta y verdura',
  'Carne y pescado',
  'Charcutería y huevos',
  'Refrigerados',
  'Panadería',
  'Despensa',
  'Congelados',
  'Otros',
]

export type Unit = 'g' | 'ml' | 'L' | 'ud' | 'bote' | 'lata' | 'bolsa' | 'paquete' | 'docena' | 'pack' | 'cda' | 'cdta'

export interface Ingredient {
  /** Clave para sumar el mismo producto entre recetas (y enlazar con la despensa) */
  id: string
  name: string
  qty?: number
  unit?: Unit
  section: Section
  optional?: boolean
  note?: string
}

export interface Step {
  text: string
  timerMin?: number
  /** Nombre corto del temporizador ("Horno", "Arroz"…) */
  timerLabel?: string
  /** Lo que se puede ir haciendo en paralelo */
  meanwhile?: string
}

export type DishType = 'horno' | 'salsa' | 'comodin'

export interface Recipe {
  id: string
  name: string
  type: DishType
  tuppers: number
  minutes: number
  /** Etiqueta extra ("carne roja de la semana") */
  tag?: string
  /** Temperatura especial al recalentar en air fryer (el salmón, 160 °C) */
  reheatTemp?: number
  ingredients: Ingredient[]
  steps: Step[]
  notes?: string[]
}

export interface CookPlanStep extends Step {
  /** Receta a la que pertenece el paso (para el color) */
  recipe?: string
}

export interface CookPlan {
  totalMin: number
  steps: CookPlanStep[]
}

export interface Meal {
  id: 'desayuno' | 'merienda' | 'cena'
  title: string
  emoji: string
  text: string
  alt?: string
}

export interface PantryItem {
  id: string
  name: string
}

export interface FixedProduct {
  id: string
  name: string
  qty?: number
  unit?: Unit
  section: Section
}

export interface AppData {
  ciclo: Record<'1' | '2' | '3', { plato1: string; plato2: string }>
  recetas: Recipe[]
  comodin: string
  planes: Record<'1' | '2' | '3', CookPlan>
  comidasFijas: Meal[]
  productosFijos: FixedProduct[]
  despensa: PantryItem[]
}
