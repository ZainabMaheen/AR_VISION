import type { ReactNode } from 'react'
import { desc, h2, kicker } from '../../lib/styles'

interface Props {
  eyebrow: string
  title: ReactNode
  description?: ReactNode
  /** Buttons shown on the right (below the text on phones). */
  actions?: ReactNode
}

export default function PageHeader({ eyebrow, title, description, actions }: Props) {
  return (
    <section className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className={kicker}>{eyebrow}</p>
        <h2 className={`${h2} break-words`}>{title}</h2>
        {description && <p className={desc}>{description}</p>}
      </div>
      {actions && <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:shrink-0">{actions}</div>}
    </section>
  )
}
