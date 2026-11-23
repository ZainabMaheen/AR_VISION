import { type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes, useId } from 'react'

// 16px on phones so iOS does not zoom into the field; 13px from 640px up
export const fieldClass =
  'w-full min-w-0 rounded-[10px] border border-[#e8e4dc] bg-white px-3 py-2.5 text-base text-[#292a27] outline-none placeholder:text-[#a9a59d] focus:border-[#b38b60] sm:text-[13px]'

const labelClass = 'mb-1.5 block text-[11px] font-semibold text-[#49463f]'
const hintClass = 'm-0 mt-1.5 text-[11px] leading-[1.5] text-[#858179]'
const errorClass = 'm-0 mt-1.5 text-[11px] leading-[1.5] text-[#a2463a]'

interface FieldProps {
  label: string
  hint?: ReactNode
  error?: string | null
}

export default function Input({ label, hint, error, className = '', id, ...rest }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <div className={className}>
      <label htmlFor={inputId} className={labelClass}>
        {label}
      </label>
      <input id={inputId} aria-invalid={error ? true : undefined} className={`${fieldClass} min-h-[42px]`} {...rest} />
      {error ? <p className={errorClass}>{error}</p> : hint ? <p className={hintClass}>{hint}</p> : null}
    </div>
  )
}

export function TextArea({ label, hint, error, className = '', id, ...rest }: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <div className={className}>
      <label htmlFor={inputId} className={labelClass}>
        {label}
      </label>
      <textarea id={inputId} aria-invalid={error ? true : undefined} className={`${fieldClass} min-h-[88px] resize-y`} {...rest} />
      {error ? <p className={errorClass}>{error}</p> : hint ? <p className={hintClass}>{hint}</p> : null}
    </div>
  )
}
