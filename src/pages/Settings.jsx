import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Spinner from '../components/ui/Spinner'

export default function Settings() {
  const [settings, setSettings] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('app_settings')
        .select('*')
        .order('key')
      setSettings(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const handleChange = (key, value) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s))
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveMsg('')
    let hasError = false

    for (const setting of settings) {
      const { error } = await supabase
        .from('app_settings')
        .update({ value: setting.value, updated_at: new Date().toISOString() })
        .eq('key', setting.key)
      if (error) {
        setSaveMsg(`Error saving ${setting.key}: ${error.message}`)
        hasError = true
        break
      }
    }

    setSaving(false)
    if (!hasError) {
      setSaveMsg('Settings saved')
      setTimeout(() => setSaveMsg(''), 2000)
    }
  }

  const maskValue = (value) => {
    if (!value || value.length < 8) return value
    return value.slice(0, 4) + '•'.repeat(Math.min(value.length - 8, 30)) + value.slice(-4)
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-heading font-bold text-[var(--text-primary)]">Settings</h2>
          <p className="text-sm text-[var(--text-tertiary)] font-sans mt-1">
            Manage API keys and configuration. Values are stored in Supabase and read at runtime.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--text-tertiary)] italic">{saveMsg}</span>
          <button onClick={handleSave} disabled={saving}
            className="sketch-btn sketch-btn-primary px-4 py-2 text-sm">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {settings.map(setting => (
          <SettingRow
            key={setting.key}
            setting={setting}
            maskedValue={maskValue(setting.value)}
            onChange={handleChange}
          />
        ))}
      </div>

      {settings.length === 0 && (
        <div className="sketch-card p-6 text-center" style={{ backgroundColor: 'var(--note-yellow)' }}>
          <p className="text-sm text-[var(--text-secondary)]">No settings found. The app_settings table may need to be seeded.</p>
        </div>
      )}

      <div className="sketch-card p-4" style={{ backgroundColor: 'var(--note-blue)' }}>
        <h3 className="text-xs font-semibold font-heading text-[var(--text-primary)] mb-2 uppercase tracking-wide">
          How it works
        </h3>
        <div className="text-xs text-[var(--text-secondary)] space-y-1.5 font-sans leading-relaxed">
          <p>API keys entered here are stored in Supabase and read by the Vercel serverless functions at runtime.</p>
          <p>If you also set environment variables in the Vercel dashboard, those serve as fallbacks — the values here take priority.</p>
          <p>Changes take effect immediately on the next API call. No redeployment needed.</p>
        </div>
      </div>
    </div>
  )
}

function SettingRow({ setting, maskedValue, onChange }) {
  const [revealed, setRevealed] = useState(false)
  const [editing, setEditing] = useState(false)

  const isSet = setting.value && setting.value.length > 0
  const statusColor = isSet ? 'bg-[var(--success)]' : 'bg-[var(--error)]'
  const statusLabel = isSet ? 'Configured' : 'Not set'

  return (
    <div className="sketch-card p-4" style={{ backgroundColor: 'var(--bg-card)' }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full ${statusColor}`} />
            <span className="text-sm font-mono font-bold text-[var(--text-primary)]">{setting.key}</span>
            <span className="text-xs text-[var(--text-tertiary)] font-sans">({statusLabel})</span>
          </div>
          {setting.description && (
            <p className="text-xs text-[var(--text-tertiary)] font-sans ml-4">{setting.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {setting.is_secret && isSet && !editing && (
            <button onClick={() => setRevealed(!revealed)}
              className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] font-sans">
              {revealed ? 'Hide' : 'Reveal'}
            </button>
          )}
          <button onClick={() => setEditing(!editing)}
            className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] font-sans font-semibold">
            {editing ? 'Done' : 'Edit'}
          </button>
        </div>
      </div>

      {editing ? (
        <input
          type={setting.is_secret ? 'password' : 'text'}
          value={setting.value}
          onChange={e => onChange(setting.key, e.target.value)}
          placeholder={`Enter ${setting.key}...`}
          className="sketch-input w-full px-3 py-2 text-sm font-mono mt-2"
          autoFocus
        />
      ) : isSet ? (
        <div className="mt-2 ml-4 text-xs font-mono text-[var(--text-tertiary)]">
          {setting.is_secret && !revealed ? maskedValue : setting.value}
        </div>
      ) : null}

      {setting.updated_at && isSet && (
        <p className="text-xs text-[var(--text-tertiary)] mt-1 ml-4 font-sans italic">
          Last updated {new Date(setting.updated_at).toLocaleString()}
        </p>
      )}
    </div>
  )
}
