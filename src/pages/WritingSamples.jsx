import { useState } from 'react'
import { useSupabaseQuery, useSupabaseMutation } from '../hooks/useSupabase'
import { AUDIENCE_COLORS, SAMPLE_TYPE_OPTIONS, AUDIENCE_OPTIONS, formatEnumLabel } from '../lib/constants'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'

export default function WritingSamples() {
  const { data: samples, loading, error, refetch } = useSupabaseQuery('writing_samples', {
    orderBy: 'created_at',
  })
  const { upsert, saving } = useSupabaseMutation('writing_samples')

  const [selectedId, setSelectedId] = useState(null)
  const [editState, setEditState] = useState(null)

  const selected = samples?.find(s => s.id === selectedId)

  const handleSelect = (sample) => {
    if (selectedId === sample.id) {
      setSelectedId(null)
      setEditState(null)
    } else {
      setSelectedId(sample.id)
      setEditState({
        title: sample.title || '',
        sample_type: sample.sample_type || 'other',
        audience: sample.audience || 'general',
        topic: sample.topic || '',
        notes: sample.notes || '',
      })
    }
  }

  const handleSave = async () => {
    if (!editState || !selectedId) return
    await upsert({ id: selectedId, ...editState })
    setSelectedId(null)
    setEditState(null)
    refetch()
  }

  if (loading) return <Spinner />
  if (error) return <p className="text-[var(--error)]">Error: {error}</p>

  return (
    <div className="flex gap-4">
      {/* List */}
      <div className="flex-1 min-w-0">
        <div className="mb-4">
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)]">Writing Samples</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">{samples.length} samples</p>
        </div>

        <div className="space-y-2">
          {samples.map(sample => {
            const audienceColor = AUDIENCE_COLORS[sample.audience] || AUDIENCE_COLORS.general
            const isSelected = selectedId === sample.id

            return (
              <button
                key={sample.id}
                onClick={() => handleSelect(sample)}
                className={`w-full text-left p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'border-[var(--accent)] bg-[var(--accent-muted)] shadow-md'
                    : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--accent)] hover:-translate-y-0.5 hover:shadow-md shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold font-heading text-[var(--text-primary)] truncate">
                      {sample.title || 'Untitled'}
                    </h3>
                    {sample.topic && (
                      <p className="text-xs text-[var(--text-tertiary)] mt-1 truncate">{sample.topic}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge label={formatEnumLabel(sample.sample_type)} bg="#6B6560" text="#fff" />
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

      {/* Detail panel */}
      {selected && editState && (
        <div className="w-96 shrink-0 space-y-4 sticky top-6 self-start">
          <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] shadow-md space-y-3">
            <h2 className="text-sm font-semibold font-heading text-[var(--text-primary)]">Edit Metadata</h2>
            <div>
              <label className="block text-xs text-[var(--text-tertiary)] mb-1 font-sans">Title</label>
              <input
                type="text"
                value={editState.title}
                onChange={e => setEditState(s => ({ ...s, title: e.target.value }))}
                className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-[var(--text-tertiary)] mb-1 font-sans">Type</label>
                <select
                  value={editState.sample_type}
                  onChange={e => setEditState(s => ({ ...s, sample_type: e.target.value }))}
                  className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm"
                >
                  {SAMPLE_TYPE_OPTIONS.map(o => <option key={o} value={o}>{formatEnumLabel(o)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[var(--text-tertiary)] mb-1 font-sans">Audience</label>
                <select
                  value={editState.audience}
                  onChange={e => setEditState(s => ({ ...s, audience: e.target.value }))}
                  className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm"
                >
                  {AUDIENCE_OPTIONS.map(o => <option key={o} value={o}>{formatEnumLabel(o)}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-tertiary)] mb-1 font-sans">Topic</label>
              <input
                type="text"
                value={editState.topic}
                onChange={e => setEditState(s => ({ ...s, topic: e.target.value }))}
                className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-tertiary)] mb-1 font-sans">Notes</label>
              <textarea
                value={editState.notes}
                onChange={e => setEditState(s => ({ ...s, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setSelectedId(null); setEditState(null) }}
                className="px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-sans"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-1.5 bg-[var(--accent)] text-white text-sm font-medium rounded-md hover:bg-[var(--accent-hover)] transition-all duration-200 disabled:opacity-50 font-sans"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          {/* Full text preview */}
          <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] shadow-md">
            <h2 className="text-sm font-semibold font-heading text-[var(--text-primary)] mb-2">Full Text</h2>
            <div className="max-h-96 overflow-y-auto text-sm text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
              {selected.full_text || 'No text available.'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
