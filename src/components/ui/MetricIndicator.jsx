/**
 * Readability metric with pass/fail color indicator.
 * @param {{ label: string, value: number|string, target?: number|string, pass?: boolean|null }} props
 */
export default function MetricIndicator({ label, value, target, pass }) {
  const colorClass = pass === true ? 'text-green-700 dark:text-green-400'
    : pass === false ? 'text-red-700 dark:text-red-400'
    : 'text-[var(--text-secondary)]'

  const dotColor = pass === true ? 'bg-[#4A7C59]'
    : pass === false ? 'bg-[#7C4A4A]'
    : 'bg-[#9E6B3A]'

  return (
    <div className="flex items-center gap-2 py-1">
      {pass !== undefined && <span className={`w-2 h-2 rounded-full ${dotColor}`} />}
      <span className="text-xs text-[var(--text-secondary)] font-sans">{label}</span>
      <span className={`text-xs font-semibold font-mono ml-auto ${colorClass}`}>
        {value}{target !== undefined && <span className="text-[var(--text-tertiary)] font-normal"> / {target}</span>}
      </span>
    </div>
  )
}
