import { type ChangeEvent, type FormEvent, useState } from 'react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Input, { fieldClass, TextArea } from '../../../components/ui/Input'
import { useMaterialsStore } from '../../catalogue/store'
import { AVAILABILITY, isWebUrl } from '../format'
import type { Availability, CatalogueMaterial, MaterialInput } from '../../catalogue/types'
import type { MaterialCategory } from '../../../types/stone'

interface Props {
  open: boolean
  /** Edit this material; leave out to add a new one. */
  material?: CatalogueMaterial
  onClose: () => void
  onSaved: (name: string, created: boolean) => void
}

const CATEGORIES: { id: MaterialCategory; label: string }[] = [
  { id: 'marble', label: 'Marble' },
  { id: 'granite', label: 'Granite' },
  { id: 'tiles', label: 'Tiles' },
]

const labelCls = 'mb-1.5 block text-[11px] font-semibold text-[#49463f]'

type Errors = Partial<Record<'name' | 'price' | 'image' | 'form', string>>

/** Add or edit a material: name, category, price, description, availability, image URL. */
export default function MaterialFormModal(props: Props) {
  return props.open ? <MaterialForm {...props} /> : null
}

function MaterialForm({ material, onClose, onSaved }: Props) {
  const add = useMaterialsStore((s) => s.add)
  const update = useMaterialsStore((s) => s.update)
  const editing = material !== undefined
  // Generated textures are data: URLs; only show real links in the field
  const startImage = material && !material.image.startsWith('data:') ? material.image : ''

  const [v, setV] = useState({
    name: material?.name ?? '',
    category: material?.category ?? ('marble' as MaterialCategory),
    finish: material?.finish ?? '',
    tone: material?.tone ?? '',
    price: material && material.price !== null ? String(material.price) : '',
    description: material?.description ?? '',
    availability: material?.availability ?? ('in-stock' as Availability),
    image: startImage,
    hidden: material?.hidden ?? false,
  })
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)

  const set = (k: keyof typeof v) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setV((s) => ({ ...s, [k]: e.target.value }))
    setErrors((x) => ({ ...x, [k]: undefined, form: undefined }))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (saving) return
    const next: Errors = {}
    if (!editing && !v.name.trim()) next.name = 'Please enter a name.'
    const price = v.price.trim() === '' ? NaN : Number(v.price)
    if (!(price >= 0)) next.price = 'Enter a price of 0 or more.'
    if (v.image.trim() && !isWebUrl(v.image)) next.image = 'Use a full link starting with https://'
    setErrors(next)
    if (Object.keys(next).length) return

    const name = material?.name ?? v.name.trim()
    // No link: the API stores none and the app shows a generated sample texture instead
    const image = v.image.trim()

    const input: MaterialInput = {
      name,
      category: v.category,
      finish: v.finish,
      tone: v.tone,
      price,
      description: v.description,
      availability: v.availability,
      image,
      hidden: v.hidden,
    }
    setSaving(true)
    try {
      if (material) {
        await update(material.id, {
          category: input.category, finish: input.finish, tone: input.tone, price: input.price,
          description: input.description, availability: input.availability, image: input.image, hidden: input.hidden,
        })
        onSaved(material.name, false)
      } else {
        onSaved((await add(input)).name, true)
      }
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'The material could not be saved.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      title={editing ? `Edit ${material.name}` : 'Add material'}
      description={editing ? 'The name cannot be changed, because favourites and saved visualisations refer to it.' : undefined}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="material-form" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Add material'}
          </Button>
        </>
      }
    >
      <form id="material-form" onSubmit={submit} noValidate className="flex flex-col gap-3.5">
        {!editing && (
          <Input label="Name" value={v.name} maxLength={50} error={errors.name} onChange={set('name')} placeholder="e.g. Calacatta Gold" />
        )}

        <div className="grid gap-3.5 sm:grid-cols-2">
          <div>
            <label htmlFor="mat-category" className={labelCls}>Category</label>
            <select id="mat-category" value={v.category} onChange={set('category')} className={`${fieldClass} min-h-[42px] cursor-pointer`}>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
          <Input label="Price per sq ft (£)" type="number" inputMode="decimal" min={0} step="0.01" value={v.price} error={errors.price} onChange={set('price')} />
          <div>
            <label htmlFor="mat-availability" className={labelCls}>Availability</label>
            <select id="mat-availability" value={v.availability} onChange={set('availability')} className={`${fieldClass} min-h-[42px] cursor-pointer`}>
              {AVAILABILITY.map((a) => (
                <option key={a.id} value={a.id}>{a.label}</option>
              ))}
            </select>
          </div>
          <Input label="Finish (optional)" value={v.finish} maxLength={30} onChange={set('finish')} placeholder="e.g. Polished" />
        </div>

        <Input label="Tone (optional)" value={v.tone} maxLength={30} onChange={set('tone')} placeholder="e.g. Warm white" />
        <TextArea label="Description (optional)" value={v.description} maxLength={400} onChange={set('description')} />

        <div className="flex items-end gap-3">
          <Input
            className="min-w-0 flex-1"
            label="Image URL (optional)"
            type="url"
            inputMode="url"
            value={v.image}
            error={errors.image}
            hint="Leave empty to use a generated sample texture."
            placeholder="https://…"
            onChange={set('image')}
          />
          {isWebUrl(v.image) && (
            <img src={v.image} alt="" className="mb-6 size-[42px] shrink-0 rounded-[8px] border border-[#e8e4dc] bg-[#f3f0ea] object-cover" />
          )}
        </div>

        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[10px] border border-[#e8e4dc] px-3 text-[13px]">
          <input
            type="checkbox"
            checked={!v.hidden}
            onChange={(e) => setV((s) => ({ ...s, hidden: !e.target.checked }))}
            className="size-4 cursor-pointer accent-[#b38b60]"
          />
          Show to customers
        </label>

        {errors.form && (
          <p role="alert" className="m-0 rounded-[9px] bg-[#fbf1ee] p-3 text-[11px] leading-[1.6] text-[#a2463a]">
            {errors.form}
          </p>
        )}
      </form>
    </Modal>
  )
}
