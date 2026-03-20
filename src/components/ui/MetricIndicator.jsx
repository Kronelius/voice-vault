/**
 * Readability metric with pass/fail color indicator — analog style.
 * @param {{ label: string, value: number|string, target?: number|string, pass?: boolean|null }} props
 */
export default function MetricIndicator({ label, value, target, pass }) {
  const colorClass = pass === true ? 'text-[var(--success)]'
    : pass === false ? 'text-[var(--error)]'
    : 'text-[var(--text-secondary)]'

  const dotColor = pass === true ? 'bg-[var(--success)]'
    : pass === false ? 'bg-[var(--error)]'
    : 'bg-[var(--accent)]'

  return (
    <div className="flex items-center gap-2 py-1 group">
      {pass !== undefined && (
        <span className={`w-2.5 h-2.5 rounded-sm ${dotColor} transition-transform duration-200 group-hover:scale-125 group-hover:rotate-12`}
          style={{ border: '1.5px solid rgba(0,0,0,0.15)' }}
        />
      )}
      <span className="text-xs text-[var(--text-secondary)] font-sans">{label}</span>
      <span className={`text-xs font-semibold font-mono ml-auto ${colorClass}`}>
        {value}{target !== undefined && <span className="text-[var(--text-tertiary)] font-normal"> / {target}</span>}
      </span>
    </div>
  )
}
