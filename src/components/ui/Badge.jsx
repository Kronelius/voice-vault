/**
 * Colored badge/tag with hand-drawn border feel.
 * @param {{ label: string, bg: string, text: string, strikethrough?: boolean, className?: string }} props
 */
export default function Badge({ label, bg, text, strikethrough = false, className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold font-sans transition-transform duration-150 hover:scale-105 hover:rotate-[-1deg] ${className}`}
      style={{
        backgroundColor: bg,
        color: text,
        textDecoration: strikethrough ? 'line-through' : 'none',
        border: '2px solid rgba(0,0,0,0.15)',
        borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
        boxShadow: '1px 1px 0px rgba(0,0,0,0.1)',
      }}
    >
      {label}
    </span>
  )
}
