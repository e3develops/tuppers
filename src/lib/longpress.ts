// v-longpress="fn": pulsación larga (600 ms) con eventos táctiles y de ratón
// (iOS 12 no tiene Pointer Events). Tras una pulsación larga se ignora el click siguiente.
import type { Directive } from 'vue'

interface El extends HTMLElement {
  _lp?: { cleanup: () => void }
}

export const vLongpress: Directive<El, () => void> = {
  mounted(el, binding) {
    let t: ReturnType<typeof setTimeout> | undefined
    let fired = false
    let sx = 0
    let sy = 0
    const start = (x: number, y: number) => {
      fired = false
      sx = x
      sy = y
      clearTimeout(t)
      t = setTimeout(() => {
        fired = true
        binding.value()
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
    const onContext = (e: Event) => e.preventDefault()
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', cancel)
    el.addEventListener('touchcancel', cancel)
    el.addEventListener('mousedown', onMouseDown)
    el.addEventListener('mouseup', cancel)
    el.addEventListener('mouseleave', cancel)
    el.addEventListener('click', onClick, true)
    el.addEventListener('contextmenu', onContext)
    el._lp = {
      cleanup() {
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
      },
    }
  },
  unmounted(el) {
    if (el._lp) el._lp.cleanup()
  },
}
