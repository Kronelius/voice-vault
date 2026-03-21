import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useTheme } from '../../hooks/useTheme'
import { supabase } from '../../lib/supabase'

const NAV_ITEMS = [
  { to: '/', label: 'Content', icon: '📄' },
  { to: '/chunks', label: 'Voice Chunks', icon: '🧩' },
  { to: '/samples', label: 'Writing Samples', icon: '📝' },
  { to: '/profile', label: 'Voice Profile', icon: '🎙️' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
]

export default function Sidebar({ onNavigate }) {
  const { dark, toggle } = useTheme()
  const [costs, setCosts] = useState({ lastRun: 0, today: 0, week: 0 })

  useEffect(() => {
    fetchCosts()
    // Refresh every 30 seconds
    const interval = setInterval(fetchCosts, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchCosts() {
    try {
      const now = new Date()
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

      // Last run
      const { data: lastRow } = await supabase
        .from('ai_usage_log')
        .select('cost_cents')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      // Today
      const { data: todayRows } = await supabase
        .from('ai_usage_log')
        .select('cost_cents')
        .gte('created_at', startOfDay)

      // Past 7 days
      const { data: weekRows } = await supabase
        .from('ai_usage_log')
        .select('cost_cents')
        .gte('created_at', sevenDaysAgo)

      setCosts({
        lastRun: lastRow?.cost_cents || 0,
        today: (todayRows || []).reduce((sum, r) => sum + (r.cost_cents || 0), 0),
        week: (weekRows || []).reduce((sum, r) => sum + (r.cost_cents || 0), 0),
      })
    } catch {
      // Table may not exist yet — silently ignore
    }
  }

  const formatCost = (cents) => {
    if (cents === 0) return '$0.00'
    if (cents < 1) return `$${(cents / 100).toFixed(4)}`
    return `$${(cents / 100).toFixed(2)}`
  }

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

      {/* API Cost Tracker */}
      <div className="px-3 pb-2">
        <div className="sketch-card p-2.5" style={{ backgroundColor: 'var(--note-pink)' }}>
          <h3 className="text-xs font-bold font-heading text-[var(--text-primary)] mb-1.5 uppercase tracking-wide">
            API Costs
          </h3>
          <div className="space-y-0.5">
            <CostRow label="Last run" value={formatCost(costs.lastRun)} />
            <CostRow label="Today" value={formatCost(costs.today)} />
            <CostRow label="Past 7 days" value={formatCost(costs.week)} />
          </div>
        </div>
      </div>

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

function CostRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[var(--text-secondary)] font-sans">{label}</span>
      <span className="text-xs font-mono font-semibold text-[var(--text-primary)]">{value}</span>
    </div>
  )
}
