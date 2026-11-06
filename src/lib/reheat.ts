// Cómo recalentar cada tupper. Solo air fryer y sartén.
import type { Recipe } from '../data/types'

export interface ReheatOption {
  title: string
  text: string
  recommended: boolean
}

export interface ReheatInfo {
  options: ReheatOption[]
  /** "No hay alternativa: es la mejor forma." (platos de horno) */
  onlyNote?: string
  rice?: string
  notes: string[]
}

export const NOTE_DUMP = 'Vuelca la comida: el tupper no entra en la air fryer.'
export const NOTE_FROZEN = 'Mejor descongelado la noche antes. Si se te olvidó, se puede desde congelado, pero tarda el doble.'

export function hasRice(r: Recipe): boolean {
  return r.ingredients.some(i => i.id === 'arroz-basmati')
}

/** `frozen`: el tupper venía del congelador (añade el aviso de descongelar) */
export function reheatFor(r: Recipe, frozen = true): ReheatInfo {
  const notes = frozen ? [NOTE_DUMP, NOTE_FROZEN] : [NOTE_DUMP]
  const rice = !hasRice(r)
    ? undefined
    : r.type === 'salsa'
      ? 'Arroz de acompañamiento: a la sartén con el guiso, o aparte con una cucharada de agua.'
      : 'Arroz de acompañamiento: aparte, a la sartén con una cucharada de agua.'
  if (r.type === 'horno') {
    const temp = r.reheatTemp || 180
    return {
      options: [
        {
          title: 'Air fryer',
          text: `${temp} °C, 8-10 min, con la comida volcada en la cesta.` + (r.reheatTemp ? ' Así no se seca.' : ''),
          recommended: true,
        },
      ],
      onlyNote: 'No hay alternativa: es la mejor forma.',
      rice,
      notes,
    }
  }
  return {
    options: [
      { title: 'Sartén o cazo', text: 'Con un chorrito de agua, a fuego medio, 5-7 min removiendo.', recommended: true },
      {
        title: 'Si no quieres pensar: air fryer',
        text: 'En un recipiente apto para horno tapado con papel de aluminio, a 170 °C 10-12 min, removiendo a mitad.',
        recommended: false,
      },
    ],
    rice,
    notes,
  }
}
