export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

const base =
  'inline-flex min-h-[42px] cursor-pointer items-center justify-center gap-2 rounded-[10px] px-4 text-xs font-semibold no-underline transition-colors disabled:cursor-default disabled:opacity-50'

const variants: Record<ButtonVariant, string> = {
  primary: 'border border-[#292a27] bg-[#292a27] text-white hover:bg-black',
  secondary: 'border border-[#e8e4dc] bg-white text-[#292a27] hover:bg-[#f5f0e8]',
  danger: 'border border-[#e6cfc8] bg-white text-[#a2463a] hover:bg-[#fbf1ee]',
  ghost: 'border border-transparent bg-transparent text-[#65635c] hover:bg-[#f5f0e8]',
}

/** Class string for buttons and links that should look like buttons. */
export const buttonClass = (variant: ButtonVariant = 'primary', extra = '') => `${base} ${variants[variant]} ${extra}`
