import { useState } from 'react'
import { useSupabaseQuery, useSupabaseMutation } from '../hooks/useSupabase'
import { AUDIENCE_COLORS, SAMPLE_TYPE_OPTIONS, AUDIENCE_OPTIONS, formatEnumLabel } from '../lib/constants'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'

const NOTE_COLORS = ['var(--note-yellow)', 'var(--note-pink)', 'var(--note-blue)', 'var(--note-green)', 'var(--note-orange)', 'var(--note-purple)']

export default function WritingSamples() {
  const { data: samples, loading, error, refetch } = useSupabaseQuery('writing_samples', { orderBy: 'created_at' })
  const { upsert, remove, saving } = useSupabaseMutation('writing_samples')

  const [selectedId, setSelectedId] = useState(null)
  const [editState, setEditState] = useState(null)
  const selected = samples?.find(s => s.id === selectedId)

  const handleSelect = (sample) => {
    if (selectedId === sample.id) { setSelectedId(null); setEditState(null) }
    else {
      setSelectedId(sample.id)
      setEditState({
        title: sample.title || '', sample_type: sample.sample_type || 'other',
        audience: sample.audience || 'general', topic: sample.topic || '', notes: sample.notes || '',
      })
    }
  }

  const handleSave = async () => {
    if (!editState || !selectedId) return
    await upsert({ id: selectedId, ...editState })
    setSelectedId(null); setEditState(null); refetch()
  }

  if (loading) return <Spinner />
  if (error) return <p className="text-[var(--error)]">Error: {error}</p>

  return (
    <div className="flex gap-4">
      <div className="flex-1 min-w-0">
        <div className="mb-4">
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)]">Writing Samples</h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-1 italic">{samples.length} samples</p>
        </div>

        <div className="space-y-3">
          {samples.map((sample, idx) => {
            const audienceColor = AUDIENCE_COLORS[sample.audience] || AUDIENCE_COLORS.general
            const isSelected = selectedId === sample.id
            const noteColor = NOTE_COLORS[idx % NOTE_COLORS.length]
            const tilt = idx % 3 === 0 ? 'rotate-[0.3deg]' : idx % 3 === 1 ? 'rotate-[-0.4deg]' : ''

            return (
              <button key={sample.id} onClick={() => handleSelect(sample)}
                className={`note-card w-full text-left p-4 cursor-pointer ${tilt} ${
                  isSelected ? 'ring-2 ring-[var(--accent)]' : ''
                }`}
                style={{ backgroundColor: isSelected ? 'var(--note-orange)' : noteColor }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold font-heading text-[var(--text-primary)] truncate">{sample.title || 'Untitled'}</h3>
                    {sample.topic && <p className="text-xs text-[var(--text-tertiary)] mt-1 truncate italic">{sample.topic}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge label={formatEnumLabel(sample.sample_type)} bg="#8B7E6A" text="#fff" />
                    <Badge label={formatEnumLabel(sample.audience)} bg={audienceColor.bg} text={audienceColor.text} />
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-tertiary)] font-mono">
                  {sample.word_count > 0 && <span>{sample.word_count.toLocaleString()} words</span>}
                  <span>{sample.chunked ? `${sample.chunk_count || 0} chunks` : 'Not chunked'}</span>
                  {sample.date_written && <span>{new Date(sample.date_written).toLocaleDateString()}</span>}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {selected && editState && (
        <div className="w-96 shrink-0 space-y-4 sticky top-6 self-start">
          <div className="sketch-card p-4 space-y-3" style={{ backgroundColor: 'var(--note-yellow)' }}>
            <h2 className="text-sm font-bold font-heading text-[var(--text-primary)]">Edit Metadata</h2>
            <div>
              <label className="block text-xs text-[var(--text-tertiary)] mb-1 font-sans font-semibold">Title</label>
              <input type="text" value={editState.title} onChange={e => setEditState(s => ({ ...s, title: e.target.value }))}
                className="sketch-input w-full px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-[var(--text-tertiary)] mb-1 font-sans font-semibold">Type</label>
                <select value={editState.sample_type} onChange={e => setEditState(s => ({ ...s, sample_type: e.target.value }))}
                  className="sketch-input w-full px-3 py-2 text-sm">
                  {SAMPLE_TYPE_OPTIONS.map(o => <option key={o} value={o}>{formatEnumLabel(o)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[var(--text-tertiary)] mb-1 font-sans font-semibold">Audience</label>
                <select value={editState.audience} onChange={e => setEditState(s => ({ ...s, audience: e.target.value }))}
                  className="sketch-input w-full px-3 py-2 text-sm">
                  {AUDIENCE_OPTIONS.map(o => <option key={o} value={o}>{formatEnumLabel(o)}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-tertiary)] mb-1 font-sans font-semibold">Topic</label>
              <input type="text" value={editState.topic} onChange={e => setEditState(s => ({ ...s, topic: e.target.value }))}
                className="sketch-input w-full px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-tertiary)] mb-1 font-sans font-semibold">Notes</label>
              <textarea value={editState.notes} onChange={e => setEditState(s => ({ ...s, notes: e.target.value }))}
                rows={3} className="sketch-input w-full px-3 py-2 text-sm" />
            </div>
            <div className="flex justify-between gap-2">
              <button onClick={async () => {
                if (!window.confirm('Delete this sample? This cannot be undone.')) return
                const ok = await remove(selectedId)
                if (ok) { setSelectedId(null); setEditState(null); refetch() }
              }} className="sketch-btn sketch-btn-danger px-3 py-1.5 text-sm">Delete</button>
              <div className="flex gap-2">
                <button onClick={() => { setSelectedId(null); setEditState(null) }}
                  className="sketch-btn sketch-btn-outline px-3 py-1.5 text-sm">Cancel</button>
                <button onClick={handleSave} disabled={saving}
                  className="sketch-btn sketch-btn-primary px-4 py-1.5 text-sm">{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          </div>

          <div className="sketch-card-alt p-4" style={{ backgroundColor: 'var(--note-blue)' }}>
            <h2 className="text-sm font-bold font-heading text-[var(--text-primary)] mb-2">Full Text</h2>
            <div className="max-h-96 overflow-y-auto text-sm text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
              {selected.full_text || 'No text available.'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
