import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { SIGNATURE_MOVE_COLORS, formatEnumLabel } from '../lib/constants'
import Spinner from '../components/ui/Spinner'

const SECTION_COLORS = [
  'var(--note-yellow)', 'var(--note-blue)', 'var(--note-green)',
  'var(--note-pink)', 'var(--note-orange)', 'var(--note-purple)',
]

export default function VoiceProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('voice_profiles').select('*').eq('is_active', true).limit(1).single()
      if (data) setProfile(data)
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    const { error } = await supabase.from('voice_profiles').update(profile).eq('id', profile.id)
    setSaving(false)
    setSaveMsg(error ? `Error: ${error.message}` : 'Saved')
    setTimeout(() => setSaveMsg(''), 2000)
  }

  const updateField = (field, value) => setProfile(p => ({ ...p, [field]: value }))
  const updateJsonField = (field, path, value) => setProfile(p => ({ ...p, [field]: { ...p[field], [path]: value } }))

  if (loading) return <Spinner />
  if (!profile) return <p className="text-[var(--text-secondary)] italic">No active voice profile found.</p>

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
          <p className="text-sm text-[var(--text-tertiary)] mt-1 italic">{profile.name} &middot; v{profile.version}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--text-tertiary)] italic">{saveMsg}</span>
          <button onClick={handleSave} disabled={saving} className="sketch-btn sketch-btn-primary px-4 py-2 text-sm">
            {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>

      <Section title="Summary" color={SECTION_COLORS[0]}>
        <textarea value={profile.summary || ''} onChange={e => updateField('summary', e.target.value)}
          rows={4} className="sketch-input w-full px-3 py-2 text-sm leading-relaxed" />
      </Section>

      <Section title="System Prompt" color={SECTION_COLORS[1]}>
        <textarea value={profile.system_prompt || ''} onChange={e => updateField('system_prompt', e.target.value)}
          rows={12} className="sketch-input w-full px-3 py-2 text-sm font-mono leading-relaxed" />
      </Section>

      <Section title="Signature Moves" color={SECTION_COLORS[2]}>
        <div className="grid gap-3 md:grid-cols-2">
          {signatureMoves.map((move, i) => {
            const colorKey = (move.pattern || '').toLowerCase().replace(/\s+/g, '_')
            const color = SIGNATURE_MOVE_COLORS[colorKey]
            return (
              <div key={i} className="sketch-card-alt p-3" style={{ backgroundColor: 'var(--bg-surface)' }}>
                <div className="flex items-center gap-2 mb-2">
                  {color && <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: color.bg, border: '1.5px solid rgba(0,0,0,0.15)' }} />}
                  <input type="text" value={move.pattern || ''}
                    onChange={e => {
                      const updated = [...signatureMoves]; updated[i] = { ...updated[i], pattern: e.target.value }
                      updateField('signature_moves_config', updated)
                    }}
                    className="text-sm font-bold font-heading bg-transparent text-[var(--text-primary)] border-none outline-none flex-1" />
                </div>
                <textarea value={move.description || ''}
                  onChange={e => {
                    const updated = [...signatureMoves]; updated[i] = { ...updated[i], description: e.target.value }
                    updateField('signature_moves_config', updated)
                  }}
                  rows={2} className="sketch-input w-full px-2 py-1 text-xs text-[var(--text-secondary)]" />
              </div>
            )
          })}
        </div>
      </Section>

      <Section title="Vocabulary" color={SECTION_COLORS[3]}>
        <div className="grid gap-4 md:grid-cols-3">
          <VocabSection title="Favorites" items={vocab.favorites || []}
            onChange={items => updateJsonField('vocabulary', 'favorites', items)} />
          <VocabSection title="Transitions" items={vocab.transitions || []}
            onChange={items => updateJsonField('vocabulary', 'transitions', items)} />
          <VocabSection title="Avoid" items={vocab.avoid || []}
            onChange={items => updateJsonField('vocabulary', 'avoid', items)} strikethrough />
        </div>
      </Section>

      <Section title="Tone Spectrum" color={SECTION_COLORS[4]}>
        <div className="space-y-3">
          {toneSpectrum.map((axis, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-[var(--text-secondary)] w-32 shrink-0 font-sans font-semibold">{axis.axis}</span>
              <input type="range" min="0" max="100" value={axis.position || 50}
                onChange={e => {
                  const updated = [...toneSpectrum]; updated[i] = { ...updated[i], position: parseInt(e.target.value) }
                  updateField('tone_spectrum', updated)
                }}
                className="flex-1 accent-[var(--accent)]" />
              <span className="text-xs font-mono text-[var(--text-primary)] w-20 text-right">
                {axis.position || 50} — {axis.label || ''}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Reading Level Targets" color={SECTION_COLORS[5]}>
        <div className="grid gap-3 md:grid-cols-2">
          {Object.entries(readingTargets).map(([audience, targets]) => (
            <div key={audience} className="sketch-card-alt p-3" style={{ backgroundColor: 'var(--bg-surface)' }}>
              <h4 className="text-xs font-bold font-heading text-[var(--accent)] mb-2 uppercase">{formatEnumLabel(audience)}</h4>
              <div className="space-y-2">
                {typeof targets === 'object' && targets !== null && Object.entries(targets).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-tertiary)] w-36 shrink-0 font-semibold">{formatEnumLabel(key)}</span>
                    <input type="text" value={typeof val === 'string' ? val : JSON.stringify(val)}
                      onChange={e => {
                        const updated = { ...readingTargets }; updated[audience] = { ...updated[audience], [key]: e.target.value }
                        updateField('reading_level_targets', updated)
                      }}
                      className="sketch-input flex-1 px-2 py-1 text-xs font-mono" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Audience Adaptation" color={SECTION_COLORS[0]}>
        <div className="grid gap-3 md:grid-cols-2">
          {Object.entries(audienceAdapt).map(([key, value]) => (
            <div key={key}>
              <label className="block text-xs text-[var(--text-tertiary)] mb-1 font-sans font-semibold">{formatEnumLabel(key)}</label>
              <textarea value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                onChange={e => updateJsonField('audience_adaptation', key, e.target.value)}
                rows={4} className="sketch-input w-full px-3 py-2 text-sm" />
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

function Section({ title, color, children }) {
  return (
    <section className="sketch-card p-5" style={{ backgroundColor: color }}>
      <h2 className="text-sm font-bold font-heading text-[var(--text-primary)] mb-3 uppercase tracking-wide"
        style={{ borderBottom: '2px dashed var(--border)', paddingBottom: '0.5em' }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function VocabSection({ title, items, onChange, strikethrough = false }) {
  const [text, setText] = useState(items.join(', '))
  useEffect(() => { setText(items.join(', ')) }, [items])
  const handleBlur = () => { onChange(text.split(',').map(s => s.trim()).filter(Boolean)) }

  return (
    <div>
      <label className="block text-xs text-[var(--text-tertiary)] mb-1 font-sans font-semibold">{title}</label>
      <div className="flex flex-wrap gap-1 mb-2 min-h-[28px]">
        {items.map((item, i) => (
          <span key={i}
            className={`inline-flex px-2 py-0.5 text-xs font-sans font-semibold ${
              strikethrough
                ? 'text-[var(--error)] line-through'
                : 'text-[var(--accent)]'
            }`}
            style={{
              backgroundColor: strikethrough ? 'var(--note-pink)' : 'var(--accent-muted)',
              border: '1.5px solid ' + (strikethrough ? 'var(--error)' : 'var(--accent)'),
              borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
            }}
          >
            {item}
          </span>
        ))}
      </div>
      <textarea value={text} onChange={e => setText(e.target.value)} onBlur={handleBlur}
        rows={2} placeholder="Comma-separated" className="sketch-input w-full px-2 py-1 text-xs" />
    </div>
  )
}
