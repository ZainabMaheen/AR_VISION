interface ToastProps {
  text: string
  visible: boolean
}

/** Small message at the bottom of the screen (same look as the AR page toast). Use with useToast(). */
export default function Toast({ text, visible }: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed bottom-[calc(24px+env(safe-area-inset-bottom))] left-4 right-4 z-[500] rounded-[10px] bg-[#292a27] px-[17px] py-[13px] text-xs text-white shadow-[0_8px_25px_rgba(0,0,0,0.15)] transition-all duration-200 sm:left-auto sm:right-6 sm:max-w-[420px] ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      }`}
    >
      {text}
    </div>
  )
}
