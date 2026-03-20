/**
 * Colored badge/tag component used for status, tone, audience, etc.
 * @param {{ label: string, bg: string, text: string, strikethrough?: boolean, className?: string }} props
 */
export default function Badge({ label, bg, text, strikethrough = false, className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-sans shadow-sm transition-transform duration-150 hover:scale-105 ${className}`}
      style={{ backgroundColor: bg, color: text, textDecoration: strikethrough ? 'line-through' : 'none' }}
    >
      {label}
    </span>
  )
}
