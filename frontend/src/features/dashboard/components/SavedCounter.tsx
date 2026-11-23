import { useScans } from '../../scans/hooks/useScans'

export default function SavedCounter() {
  const { scans, loading } = useScans()

  return (
    <div className="flex min-w-[190px] flex-col gap-1.5 self-start rounded-2xl border border-[#e8e4dc] bg-white p-5">
      <p className="m-0 text-[10px] font-semibold tracking-[1.4px] text-[#a67e50]">YOUR NEXT SPACE</p>
      <strong className="text-[44px] font-light leading-none tracking-[-2px]">{loading ? '—' : String(scans.length).padStart(2, '0')}</strong>
      <span className="text-xs text-[#858179]">{scans.length === 1 ? 'saved visualisation' : 'saved visualisations'}</span>
    </div>
  )
}