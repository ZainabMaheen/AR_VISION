import { useCallback, useEffect, useRef, useState } from 'react'
import Toast from './Toast'

/** const { showToast, toast } = useToast(); …; return <>{…}{toast}</> */
export function useToast(duration = 2600) {
  const [state, setState] = useState({ text: '', visible: false })
  const timer = useRef<number | undefined>(undefined)

  const showToast = useCallback(
    (text: string) => {
      setState({ text, visible: true })
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setState((s) => ({ ...s, visible: false })), duration)
    },
    [duration],
  )

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return { showToast, toast: <Toast text={state.text} visible={state.visible} /> }
}
