import { ChevronRight, WandSparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { HERO_IMAGE } from '../../../lib/constants'

export default function ARPromoBanner() {
  return (
    <section id="ar-preview" className="relative mt-10 min-h-[380px] overflow-hidden rounded-[18px] bg-[#d7d0c4] md:min-h-[440px]">
      <img
        src={HERO_IMAGE}
        alt="Modern living room with natural wood and stone finishes"
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#1c1c19]/70 via-[#1c1c19]/30 to-transparent" />

      <div className="relative z-10 flex h-full min-h-[380px] max-w-[520px] flex-col items-start justify-center gap-4 p-7 text-white md:min-h-[440px] md:p-12">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-[10px] font-semibold tracking-[1.4px] backdrop-blur">
          <span className="size-1.5 rounded-full bg-[#b38b60]" /> PROTOTYPE AR EXPERIENCE
        </span>

        <h2 className="m-0 text-[34px] font-medium leading-[1.12] tracking-[-1px] md:text-[44px]">
          See your space
          <br />
          <em className="font-normal italic text-[#e4d8c5]">in a new finish.</em>
        </h2>

        <p className="m-0 text-[13px] leading-[1.7] text-white/80">
          Scan your room and preview different materials
          <br className="max-md:hidden" />
          before making your choice.
        </p>

        <Link
          to="/arpreview"
          className="inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-[#f5f0e8] px-5 text-xs font-semibold text-[#292a27] no-underline hover:bg-white"
        >
          <WandSparkles size={15} /> Scan My Room
        </Link>
      </div>

      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-3 rounded-xl border border-white/60 bg-white/90 px-3.5 py-2.5 text-[#4c4a43] backdrop-blur max-sm:hidden">
        <span className="text-[11px] font-semibold text-[#a67e50]">01</span>
        <span className="flex flex-col gap-0.5">
          <strong className="text-xs font-semibold">Villa No. 04</strong>
          <small className="text-[10px] text-[#858179]">Living space / Daylight</small>
        </span>
        <ChevronRight size={16} />
      </div>
    </section>
  )
}