import type { ReactNode } from 'react'

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'dark'

const TONES: Record<BadgeTone, string> = {
  neutral: 'border-[#e8e4dc] bg-[#faf8f4] text-[#5f5c55]',
  accent: 'border-[#e6d9c6] bg-[#faf5ec] text-[#86602f]',
  success: 'border-[#d8e0cf] bg-[#f3f6ef] text-[#5d6b4d]',
  warning: 'border-[#ecdcb9] bg-[#fbf5e8] text-[#8a6418]',
  danger: 'border-[#ecd3cc] bg-[#fbf1ee] text-[#a2463a]',
  dark: 'border-[#292a27] bg-[#292a27] text-white',
}

/** Small pill label. Pair colour with an icon or clear text (never colour alone). */
export default function Badge({ tone = 'neutral', icon, children }: { tone?: BadgeTone; icon?: ReactNode; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold ${TONES[tone]}`}>
      {icon}
      {children}
    </span>
  )
}
