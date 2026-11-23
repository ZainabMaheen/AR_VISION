import { useLayoutEffect, useRef, useState } from 'react'

export interface ContainRect {
  left: number
  top: number
  width: number
  height: number
}

const EMPTY: ContainRect = { left: 0, top: 0, width: 0, height: 0 }

function fit(cw: number, ch: number, aspect: number): ContainRect {
  if (cw <= 0 || ch <= 0 || !(aspect > 0)) return EMPTY
  let width = cw
  let height = cw / aspect
  if (height > ch) {
    height = ch
    width = ch * aspect
  }
  return {
    left: Math.round((cw - width) / 2),
    top: Math.round((ch - height) / 2),
    width: Math.round(width),
    height: Math.round(height),
  }
}

/**
 * Size and offset of an image with the given aspect ratio (width / height)
 * fitted inside the container ("object-fit: contain"), kept up to date with
 * ResizeObserver. Put the photo, canvas and marker inside one box with this
 * rect so they always line up exactly.
 */
export function useContainRect<T extends HTMLElement = HTMLDivElement>(aspect: number) {
  const ref = useRef<T>(null)
  const [rect, setRect] = useState<ContainRect>(EMPTY)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => {
      const next = fit(el.clientWidth, el.clientHeight, aspect)
      setRect((prev) =>
        prev.left === next.left && prev.top === next.top && prev.width === next.width && prev.height === next.height
          ? prev
          : next,
      )
    }
    update()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update)
      return () => window.removeEventListener('resize', update)
    }
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [aspect])

  return { ref, rect }
}

export default useContainRect
