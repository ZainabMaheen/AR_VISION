/** Opens a saved visualisation on the AR page. */
export const scanUrl = (id: string) => `/arpreview?scan=${encodeURIComponent(id)}`

/** 42px square icon button used on visualisation cards. */
export const cardIconBtn =
  'grid size-[42px] shrink-0 cursor-pointer place-items-center rounded-[10px] border border-[#e8e4dc] bg-white text-[#65635c] hover:bg-[#f5f0e8] disabled:cursor-default disabled:opacity-50'
