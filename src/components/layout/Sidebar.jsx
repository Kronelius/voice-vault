import { NavLink } from 'react-router-dom'
import { useTheme } from '../../hooks/useTheme'

const NAV_ITEMS = [
  { to: '/', label: 'Content', icon: '📄' },
  { to: '/chunks', label: 'Voice Chunks', icon: '🧩' },
  { to: '/samples', label: 'Writing Samples', icon: '📝' },
  { to: '/profile', label: 'Voice Profile', icon: '🎙️' },
]

export default function Sidebar() {
  const { dark, toggle } = useTheme()

  return (
    <aside className="w-56 shrink-0 h-screen sticky top-0 flex flex-col border-r border-[var(--border)] bg-[var(--bg-surface)]">
      <div className="px-4 py-5 border-b border-[var(--border)]">
        <h1 className="text-lg font-bold font-heading text-[var(--text-primary)]">
          Voice Vault
        </h1>
        <p className="text-xs text-[var(--text-tertiary)] font-sans mt-0.5">Content Management</p>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-sans transition-colors ${
                isActive
                  ? 'bg-[var(--accent-muted)] text-[var(--accent)] font-medium'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-[var(--border)]">
        <button
          onClick={toggle}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors font-sans"
        >
          {dark ? '☀️' : '🌙'}
          {dark ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
    </aside>
  )
}
