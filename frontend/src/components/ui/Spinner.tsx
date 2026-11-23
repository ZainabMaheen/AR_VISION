/** Small bronze spinner. */
export default function Spinner({ size = 16, label }: { size?: number; label?: string }) {
  return (
    <span
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className="inline-block shrink-0 animate-spin rounded-full border-2 border-[#e0dbd2] border-t-[#b38b60] motion-reduce:animate-none"
      style={{ width: size, height: size }}
    />
  )
}
