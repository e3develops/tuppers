// Aviso breve abajo, con acción opcional ("Deshacer")
import { reactive } from 'vue'

export const toast = reactive<{ text: string; action?: string; onAction?: () => void; id: number }>({ text: '', id: 0 })
let timer: ReturnType<typeof setTimeout> | undefined

export function showToast(text: string, action?: string, onAction?: () => void, ms = 4500) {
  toast.text = text
  toast.action = action
  toast.onAction = onAction
  toast.id++
  clearTimeout(timer)
  timer = setTimeout(hideToast, ms)
}

export function hideToast() {
  toast.text = ''
  toast.action = undefined
  toast.onAction = undefined
}
