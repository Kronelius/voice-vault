import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { SIGNATURE_MOVE_COLORS, formatEnumLabel } from '../lib/constants'
import Spinner from '../components/ui/Spinner'

export default function VoiceProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('voice_profiles')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single()
      if (data) setProfile(data)
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    const { error } = await supabase
      .from('voice_profiles')
      .update(profile)
      .eq('id', profile.id)
    setSaving(false)
    setSaveMsg(error ? `Error: ${error.message}` : 'Saved')
    setTimeout(() => setSaveMsg(''), 2000)
  }

  const updateField = (field, value) => setProfile(p => ({ ...p, [field]: value }))
  const updateJsonField = (field, path, value) => {
    setProfile(p => ({ ...p, [field]: { ...p[field], [path]: value } }))
  }

  if (loading) return <Spinner />
  if (!profile) return <p className="text-[var(--text-secondary)]">No active voice profile found.</p>

  const vocab = profile.vocabulary || { favorites: [], transitions: [], avoid: [] }
  const toneSpectrum = profile.tone_spectrum || []
  const signatureMoves = profile.signature_moves_config || []
  const readingTargets = profile.reading_level_targets || {}
  const audienceAdapt = profile.audience_adaptation || {}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)]">Voice Profile</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {profile.name} &middot; v{profile.version}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--text-tertiary)]">{saveMsg}</span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-[var(--accent)] text-white text-sm font-medium rounded-md hover:bg-[var(--accent-hover)] transition-all duration-200 disabled:opacity-50 font-sans"
          >
            {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>

      {/* Summary */}
      <Section title="Summary">
        <textarea
          value={profile.summary || ''}
          onChange={e => updateField('summary', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] text-sm leading-relaxed"
        />
      </Section>

      {/* System Prompt */}
      <Section title="System Prompt">
        <textarea
          value={profile.system_prompt || ''}
          onChange={e => updateField('system_prompt', e.target.value)}
          rows={12}
          className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] text-sm font-mono leading-relaxed"
        />
      </Section>

      {/* Signature Moves */}
      <Section title="Signature Moves">
        <div className="grid gap-3 md:grid-cols-2">
          {signatureMoves.map((move, i) => {
            const colorKey = (move.pattern || '').toLowerCase().replace(/\s+/g, '_')
            const color = SIGNATURE_MOVE_COLORS[colorKey]
            return (
              <div key={i} className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)]">
                <div className="flex items-center gap-2 mb-2">
                  {color && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color.bg }} />}
                  <input
                    type="text"
                    value={move.pattern || ''}
                    onChange={e => {
                      const updated = [...signatureMoves]
                      updated[i] = { ...updated[i], pattern: e.target.value }
                      updateField('signature_moves_config', updated)
                    }}
                    className="text-sm font-semibold font-heading bg-transparent text-[var(--text-primary)] border-none outline-none flex-1"
                  />
                </div>
                <textarea
                  value={move.description || ''}
                  onChange={e => {
                    const updated = [...signatureMoves]
                    updated[i] = { ...updated[i], description: e.target.value }
                    updateField('signature_moves_config', updated)
                  }}
                  rows={2}
                  className="w-full px-2 py-1 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] text-xs"
                />
              </div>
            )
          })}
        </div>
      </Section>

      {/* Vocabulary */}
      <Section title="Vocabulary">
        <div className="grid gap-4 md:grid-cols-3">
          <VocabSection
            title="Favorites"
            items={vocab.favorites || []}
            onChange={items => updateJsonField('vocabulary', 'favorites', items)}
          />
          <VocabSection
            title="Transitions"
            items={vocab.transitions || []}
            onChange={items => updateJsonField('vocabulary', 'transitions', items)}
          />
          <VocabSection
            title="Avoid"
            items={vocab.avoid || []}
            onChange={items => updateJsonField('vocabulary', 'avoid', items)}
            strikethrough
          />
        </div>
      </Section>

      {/* Tone Spectrum */}
      <Section title="Tone Spectrum">
        <div className="space-y-3">
          {toneSpectrum.map((axis, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-[var(--text-secondary)] w-32 shrink-0 font-sans">{axis.axis}</span>
              <input
                type="range"
                min="0"
                max="100"
                value={axis.position || 50}
                onChange={e => {
                  const updated = [...toneSpectrum]
                  updated[i] = { ...updated[i], position: parseInt(e.target.value) }
                  updateField('tone_spectrum', updated)
                }}
                className="flex-1 accent-[var(--accent)]"
              />
              <span className="text-xs font-mono text-[var(--text-primary)] w-20 text-right">
                {axis.position || 50} — {axis.label || ''}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* Reading Level Targets */}
      <Section title="Reading Level Targets">
        <div className="grid gap-3 md:grid-cols-2">
          {Object.entries(readingTargets).map(([audience, targets]) => (
            <div key={audience} className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)]">
              <h4 className="text-xs font-semibold font-heading text-[var(--text-primary)] mb-2 uppercase">
                {formatEnumLabel(audience)}
              </h4>
              <div className="space-y-2">
                {typeof targets === 'object' && targets !== null && Object.entries(targets).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-tertiary)] w-36 shrink-0">{formatEnumLabel(key)}</span>
                    <input
                      type="text"
                      value={typeof val === 'string' ? val : JSON.stringify(val)}
                      onChange={e => {
                        const updated = { ...readingTargets }
                        updated[audience] = { ...updated[audience], [key]: e.target.value }
                        updateField('reading_level_targets', updated)
                      }}
                      className="flex-1 px-2 py-1 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] text-xs font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Audience Adaptation */}
      <Section title="Audience Adaptation">
        <div className="grid gap-3 md:grid-cols-2">
          {Object.entries(audienceAdapt).map(([key, value]) => (
            <div key={key}>
              <label className="block text-xs text-[var(--text-tertiary)] mb-1 font-sans">{formatEnumLabel(key)}</label>
              <textarea
                value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                onChange={e => updateJsonField('audience_adaptation', key, e.target.value)}
                rows={4}
                className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] text-sm"
              />
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className="p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] shadow-sm">
      <h2 className="text-sm font-semibold font-heading text-[var(--accent)] mb-3 uppercase tracking-wide">
        {title}
      </h2>
      {children}
    </section>
  )
}

function VocabSection({ title, items, onChange, strikethrough = false }) {
  const [text, setText] = useState(items.join(', '))

  useEffect(() => {
    setText(items.join(', '))
  }, [items])

  const handleBlur = () => {
    onChange(text.split(',').map(s => s.trim()).filter(Boolean))
  }

  return (
    <div>
      <label className="block text-xs text-[var(--text-tertiary)] mb-1 font-sans">{title}</label>
      <div className="flex flex-wrap gap-1 mb-2 min-h-[28px]">
        {items.map((item, i) => (
          <span
            key={i}
            className={`inline-flex px-2 py-0.5 rounded text-xs font-sans ${
              strikethrough
                ? 'bg-[#E04B5A18] text-[var(--error)] line-through'
                : 'bg-[var(--accent-muted)] text-[var(--accent)]'
            }`}
          >
            {item}
          </span>
        ))}
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        onBlur={handleBlur}
        rows={2}
        placeholder="Comma-separated"
        className="w-full px-2 py-1 rounded border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs"
      />
    </div>
  )
}
