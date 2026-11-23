import { type ReactNode, useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  title: string
  description?: ReactNode
  onClose: () => void
  children?: ReactNode
  /** Buttons pinned to the bottom of the dialog. */
  footer?: ReactNode
}

/**
 * Dialog: bottom sheet on phones, centred card from 640px up.
 * Scrolls internally, closes on backdrop tap and Escape, locks page scroll.
 */
export default function Modal({ open, title, description, onClose, children, footer }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  const titleId = useId()

  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Focus the first field (or the dialog itself)
    const panel = panelRef.current
    const first = panel?.querySelector<HTMLElement>('input, select, textarea')
    ;(first ?? panel)?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeRef.current()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[400] flex items-end justify-center sm:items-center sm:p-4">
      <div aria-hidden="true" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex max-h-[calc(100dvh-24px)] w-full flex-col overflow-hidden rounded-t-[16px] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.2)] outline-none sm:max-h-[calc(100dvh-48px)] sm:max-w-[480px] sm:rounded-[16px]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#eeeae3] px-5 pb-4 pt-5">
          <div className="min-w-0">
            <h3 id={titleId} className="m-0 text-[16px] font-semibold tracking-[-0.2px]">
              {title}
            </h3>
            {description && <p className="m-0 mt-1.5 text-xs leading-[1.6] text-[#858179]">{description}</p>}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="-mr-2 -mt-1.5 grid size-10 shrink-0 cursor-pointer place-items-center rounded-lg text-[#65635c] hover:bg-[#f5f0e8]"
          >
            <X size={18} />
          </button>
        </div>

        {children && <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>}

        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-[#eeeae3] px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-4 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
