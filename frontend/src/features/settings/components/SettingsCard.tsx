import type { FormEvent, ReactNode } from 'react'
import { Check } from 'lucide-react'
import Button from '../../../components/ui/Button'

interface Props {
  title: string
  description: string
  children: ReactNode
  onSubmit: (e: FormEvent) => void
  saved: boolean
  dirty: boolean
}

/** A titled settings section with a Save button and a "Saved" confirmation. */
export default function SettingsCard({ title, description, children, onSubmit, saved, dirty }: Props) {
  return (
    <form onSubmit={onSubmit} noValidate className="min-w-0 rounded-2xl border border-[#e8e4dc] bg-white">
      <div className="border-b border-[#eeeae3] px-5 pb-4 pt-5">
        <h3 className="m-0 text-sm font-semibold">{title}</h3>
        <p className="m-0 mt-1.5 text-xs leading-[1.6] text-[#858179]">{description}</p>
      </div>
      <div className="flex flex-col gap-4 p-5">{children}</div>
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#eeeae3] px-5 py-4">
        {saved && !dirty && (
          <span role="status" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8b9a78]">
            <Check size={14} />
            Saved
          </span>
        )}
        <Button type="submit" disabled={!dirty} className="max-sm:w-full">
          Save changes
        </Button>
      </div>
    </form>
  )
}
