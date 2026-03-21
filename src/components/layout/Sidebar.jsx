import { NavLink } from 'react-router-dom'
import { useTheme } from '../../hooks/useTheme'

const NAV_ITEMS = [
  { to: '/', label: 'Content', icon: '📄' },
  { to: '/chunks', label: 'Voice Chunks', icon: '🧩' },
  { to: '/samples', label: 'Writing Samples', icon: '📝' },
  { to: '/profile', label: 'Voice Profile', icon: '🎙️' },
]

export default function Sidebar({ onNavigate }) {
  const { dark, toggle } = useTheme()

  return (
    <aside className="w-56 shrink-0 h-screen sticky top-0 flex flex-col border-r-[3px] border-[var(--border-dark)] bg-[var(--bg-surface)]">
      <div className="px-4 py-5 border-b-[2px] border-dashed border-[var(--border)]">
        <h1 className="text-xl font-bold font-heading text-[var(--accent)]" style={{ letterSpacing: '-0.02em' }}>
          Voice Vault
        </h1>
        <p className="text-xs text-[var(--text-tertiary)] font-sans mt-0.5 italic">Content Management</p>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-1">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3.5 text-sm font-sans transition-all duration-200 ${
                isActive
                  ? 'sketch-card font-semibold text-[var(--accent)] bg-[var(--note-orange)]'
                  : 'nav-item-hover rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-3 border-t-[2px] border-dashed border-[var(--border)]">
        <button
          onClick={toggle}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-all duration-200 font-sans"
        >
          {dark ? '☀️' : '🌙'}
          {dark ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
    </aside>
  )
}
