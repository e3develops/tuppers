// v-longpress="fn": pulsación larga (600 ms) con eventos táctiles y de ratón
// (iOS 12 no tiene Pointer Events). Si no hay función, no hace nada y no se traga el toque.
// Tras una pulsación larga que sí hace algo, se ignora el click siguiente.
import type { Directive } from 'vue'

type Fn = (() => void) | null | undefined

interface El extends HTMLElement {
  _lpFn?: Fn
  _lpCleanup?: () => void
}

export const vLongpress: Directive<El, Fn> = {
  mounted(el, binding) {
    el._lpFn = binding.value
    let t: ReturnType<typeof setTimeout> | undefined
    let fired = false
    let sx = 0
    let sy = 0
    const start = (x: number, y: number) => {
      fired = false
      sx = x
      sy = y
      clearTimeout(t)
      if (typeof el._lpFn !== 'function') return
      t = setTimeout(() => {
        const fn = el._lpFn
        if (typeof fn !== 'function') return
        fired = true
        fn()
      }, 600)
    }
    const cancel = () => clearTimeout(t)
    const onTouchStart = (e: TouchEvent) => start(e.touches[0].clientX, e.touches[0].clientY)
    const onTouchMove = (e: TouchEvent) => {
      const p = e.touches[0]
      if (Math.abs(p.clientX - sx) > 10 || Math.abs(p.clientY - sy) > 10) cancel()
    }
    const onMouseDown = (e: MouseEvent) => start(e.clientX, e.clientY)
    const onClick = (e: Event) => {
      if (fired) {
        e.stopPropagation()
        e.preventDefault()
        fired = false
      }
    }
    const onContext = (e: Event) => {
      if (typeof el._lpFn === 'function') e.preventDefault()
    }
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', cancel)
    el.addEventListener('touchcancel', cancel)
    el.addEventListener('mousedown', onMouseDown)
    el.addEventListener('mouseup', cancel)
    el.addEventListener('mouseleave', cancel)
    el.addEventListener('click', onClick, true)
    el.addEventListener('contextmenu', onContext)
    el._lpCleanup = () => {
      cancel()
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', cancel)
      el.removeEventListener('touchcancel', cancel)
      el.removeEventListener('mousedown', onMouseDown)
      el.removeEventListener('mouseup', cancel)
      el.removeEventListener('mouseleave', cancel)
      el.removeEventListener('click', onClick, true)
      el.removeEventListener('contextmenu', onContext)
    }
  },
  updated(el, binding) {
    el._lpFn = binding.value
  },
  unmounted(el) {
    if (el._lpCleanup) el._lpCleanup()
  },
}
