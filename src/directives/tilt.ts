import type { DirectiveBinding } from 'vue'

interface TiltOptions {
  maxTilt?: number
  scale?: number
  perspective?: number
  speed?: number
}

export default {
  mounted(el: HTMLElement, binding: DirectiveBinding<TiltOptions>) {
    const opts = binding.value || {}
    const maxTilt = opts.maxTilt ?? 4
    const scale = opts.scale ?? 1.02
    const perspective = opts.perspective ?? 1000
    const speed = opts.speed ?? 300

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isTouchDevice = 'ontouchstart' in window
    if (prefersReducedMotion || isTouchDevice) return

    const handlers = {
      mouseenter() {
        el.dataset.origShadow = el.style.boxShadow
        el.style.transition = `transform ${speed}ms ease-out, box-shadow ${speed}ms ease-out`
      },

      mousemove(e: MouseEvent) {
        const rect = el.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const cx = rect.width / 2
        const cy = rect.height / 2

        const rotateY = ((x - cx) / cx) * maxTilt
        const rotateX = ((cy - y) / cy) * maxTilt

        el.style.transform =
          `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`

        const sx = ((x - cx) / cx) * 4
        const sy = ((cy - y) / cy) * 4
        el.style.boxShadow = `${sx}px ${sy}px 20px rgba(0,0,0,0.10)`
      },

      mouseleave() {
        el.style.transform = ''
        el.style.boxShadow = el.dataset.origShadow || ''
      }
    }

    el.addEventListener('mouseenter', handlers.mouseenter)
    el.addEventListener('mousemove', handlers.mousemove)
    el.addEventListener('mouseleave', handlers.mouseleave)
    ;(el as unknown as Record<string, unknown>)._tiltHandlers = handlers
  },

  unmounted(el: HTMLElement) {
    const handlers = (el as unknown as Record<string, unknown>)._tiltHandlers as
      | { mouseenter: () => void; mousemove: (e: MouseEvent) => void; mouseleave: () => void }
      | undefined
    if (handlers) {
      el.removeEventListener('mouseenter', handlers.mouseenter)
      el.removeEventListener('mousemove', handlers.mousemove)
      el.removeEventListener('mouseleave', handlers.mouseleave)
      delete (el as unknown as Record<string, unknown>)._tiltHandlers
    }
    el.style.transform = ''
    el.style.boxShadow = ''
    el.style.transition = ''
  }
}
