import { useId, useState } from 'react'
import { fieldClass } from '../../../components/ui/Input'
import { formatArea, fromSqFt, orderSqFt, toSqFt, unitShort } from '../../cart/area'
import type { AreaUnit } from '../../settings/store'

interface Props {
  areaSqFt: number
  wastage: number
  unit: AreaUnit
  onArea: (sqft: number) => void
  onWastage: (pct: number) => void
}

type Mode = 'area' | 'size'

const label = 'mb-1 block text-[11px] font-semibold text-[#49463f]'
const input = `${fieldClass} min-h-[42px] tabular-nums`

const toText = (n: number) => (n > 0 ? String(Math.round(n * 100) / 100) : '')
const parse = (s: string) => {
  const n = Number(s.replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : 0
}

/**
 * Area calculator: type the area, or length × width, plus a wastage %.
 * Works in the customer's unit (Settings); the result is stored in sq ft.
 */
export default function AreaCalculator({ areaSqFt, wastage, unit, onArea, onWastage }: Props) {
  const id = useId()
  const [mode, setMode] = useState<Mode>('area')
  const [areaText, setAreaText] = useState(toText(fromSqFt(areaSqFt, unit)))
  const [length, setLength] = useState('')
  const [width, setWidth] = useState('')
  const lin = unit === 'sqm' ? 'm' : 'ft'

  const fromSize = (l: string, w: string) => {
    const a = parse(l) * parse(w)
    setAreaText(toText(a))
    onArea(toSqFt(a, unit))
  }

  const tab = (m: Mode, text: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === m}
      onClick={() => setMode(m)}
      className={`min-h-10 flex-1 cursor-pointer rounded-[8px] px-3 text-[12px] ${
        mode === m ? 'bg-white font-semibold text-[#292a27] shadow-[0_1px_3px_rgba(0,0,0,0.08)]' : 'text-[#77736c]'
      }`}
    >
      {text}
    </button>
  )

  return (
    <div className="flex flex-col gap-3">
      <div role="tablist" aria-label="How to enter the area" className="flex gap-1 rounded-[10px] bg-[#f3f0ea] p-1">
        {tab('area', `I know the area`)}
        {tab('size', `Length × width`)}
      </div>

      {mode === 'area' ? (
        <div>
          <label htmlFor={`${id}-area`} className={label}>
            Area to cover ({unitShort(unit)})
          </label>
          <input
            id={`${id}-area`}
            type="number"
            inputMode="decimal"
            min={0}
            step="0.1"
            value={areaText}
            placeholder="e.g. 120"
            onChange={(e) => {
              setAreaText(e.target.value)
              onArea(toSqFt(parse(e.target.value), unit))
            }}
            className={input}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor={`${id}-l`} className={label}>
              Length ({lin})
            </label>
            <input
              id={`${id}-l`}
              type="number"
              inputMode="decimal"
              min={0}
              step="0.1"
              value={length}
              onChange={(e) => {
                setLength(e.target.value)
                fromSize(e.target.value, width)
              }}
              className={input}
            />
          </div>
          <div>
            <label htmlFor={`${id}-w`} className={label}>
              Width ({lin})
            </label>
            <input
              id={`${id}-w`}
              type="number"
              inputMode="decimal"
              min={0}
              step="0.1"
              value={width}
              onChange={(e) => {
                setWidth(e.target.value)
                fromSize(length, e.target.value)
              }}
              className={input}
            />
          </div>
        </div>
      )}

      <label className="block">
        <span className="flex items-center justify-between gap-2 text-[11px]">
          <span className="font-semibold text-[#49463f]">Wastage</span>
          <strong className="font-semibold tabular-nums">{wastage}%</strong>
        </span>
        <input
          type="range"
          min={0}
          max={25}
          step={1}
          value={wastage}
          onChange={(e) => onWastage(Number(e.target.value))}
          className="block h-10 w-full cursor-pointer accent-[#b38b60]"
        />
      </label>

      <p className="m-0 rounded-[8px] bg-[#faf8f4] px-3 py-2 text-[12px] leading-[1.5] text-[#5f5c55]">
        {areaSqFt > 0 ? (
          <>
            Order about <strong className="text-[#292a27]">{formatArea(orderSqFt({ areaSqFt, wastage }), unit)}</strong>{' '}
            ({formatArea(areaSqFt, unit)} + {wastage}% for cuts and breakages)
          </>
        ) : (
          'Enter the area so the shop can quote accurately. You can leave it empty if you are not sure.'
        )}
      </p>
    </div>
  )
}
