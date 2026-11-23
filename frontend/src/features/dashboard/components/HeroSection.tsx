import { Camera, Grid2x2, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import SavedCounter from './SavedCounter'

export default function HeroSection() {
  return (
    <section className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
      <div>
        <p className="m-0 mb-4 flex items-center gap-2 text-[10px] font-semibold tracking-[1.4px] text-[#a67e50]">
          <Sparkles size={14} />
          MATERIAL EXPLORATION, REIMAGINED
        </p>

        <h2 className="m-0 text-[40px] font-medium leading-[1.1] tracking-[-1.5px] sm:text-[52px]">
          Visualise <em className="font-normal italic text-[#b38b60]">before</em>
          <br />
          you buy.
        </h2>

        <p className="mb-0 mt-5 text-sm leading-[1.7] text-[#858179]">
          Preview granite, marble and tiles in your actual space.
          <br className="max-md:hidden" />
          Make confident material decisions from the first look.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            to="/arpreview"
            className="inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-[#292a27] px-5 text-xs font-semibold text-white no-underline hover:bg-black"
          >
            <Camera size={15} /> Start AR Preview
          </Link>
          <Link
            to="/catalogue"
            className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-[#e8e4dc] bg-white px-5 text-xs font-semibold text-[#292a27] no-underline hover:bg-[#f5f0e8]"
          >
            <Grid2x2 size={15} /> Explore Materials
          </Link>
        </div>
      </div>

      <SavedCounter />
    </section>
  )
}