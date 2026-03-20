/**
 * Colored badge/tag component used for status, tone, audience, etc.
 * @param {{ label: string, bg: string, text: string, strikethrough?: boolean, className?: string }} props
 */
export default function Badge({ label, bg, text, strikethrough = false, className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium font-sans ${className}`}
      style={{ backgroundColor: bg, color: text, textDecoration: strikethrough ? 'line-through' : 'none' }}
    >
      {label}
    </span>
  )
}
