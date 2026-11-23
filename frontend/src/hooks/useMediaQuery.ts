import { useCallback, useSyncExternalStore } from 'react'

/** True while the CSS media query matches, e.g. useMediaQuery('(max-width: 650px)'). */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {}
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    [query],
  )
  const getSnapshot = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false)
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

export default useMediaQuery
