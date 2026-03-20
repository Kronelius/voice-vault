/**
 * Readability metric with pass/fail color indicator.
 * @param {{ label: string, value: number|string, target?: number|string, pass?: boolean|null }} props
 */
export default function MetricIndicator({ label, value, target, pass }) {
  const colorClass = pass === true ? 'text-green-600 dark:text-green-400'
    : pass === false ? 'text-red-500 dark:text-red-400'
    : 'text-[var(--text-secondary)]'

  const dotColor = pass === true ? 'bg-[#2EAD6A]'
    : pass === false ? 'bg-[#E04B5A]'
    : 'bg-[#6C5CE7]'

  return (
    <div className="flex items-center gap-2 py-1 group">
      {pass !== undefined && <span className={`w-2 h-2 rounded-full ${dotColor} transition-transform duration-200 group-hover:scale-125`} />}
      <span className="text-xs text-[var(--text-secondary)] font-sans">{label}</span>
      <span className={`text-xs font-semibold font-mono ml-auto ${colorClass}`}>
        {value}{target !== undefined && <span className="text-[var(--text-tertiary)] font-normal"> / {target}</span>}
      </span>
    </div>
  )
}
