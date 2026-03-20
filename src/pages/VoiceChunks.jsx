import { useState, useMemo } from 'react'
import { useSupabaseQuery, useSupabaseMutation } from '../hooks/useSupabase'
import {
  AUDIENCE_COLORS, TONE_COLORS, SIGNATURE_MOVE_COLORS, QUALITY_COLORS,
  AUDIENCE_OPTIONS, TONE_OPTIONS, QUALITY_OPTIONS, SIGNATURE_MOVE_OPTIONS,
  formatEnumLabel,
} from '../lib/constants'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'

export default function VoiceChunks() {
  const { data: chunks, loading, error, refetch } = useSupabaseQuery('voice_chunks', {
    select: '*, writing_samples(title)',
    orderBy: 'created_at',
  })
  const { upsert, saving } = useSupabaseMutation('voice_chunks')

  const [expandedId, setExpandedId] = useState(null)
  const [editState, setEditState] = useState(null)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ audience: '', tone: '', quality: '', signature_move: '' })

  const filtered = useMemo(() => {
    if (!chunks) return []
    return chunks.filter(c => {
      if (filters.audience && c.audience !== filters.audience) return false
      if (filters.tone && c.tone !== filters.tone) return false
      if (filters.quality && c.quality !== filters.quality) return false
      if (filters.signature_move && !(c.signature_moves || []).includes(filters.signature_move)) return false
      if (search) {
        const q = search.toLowerCase()
        return (c.excerpt || '').toLowerCase().includes(q) ||
               (c.full_text || '').toLowerCase().includes(q)
      }
      return true
    })
  }, [chunks, filters, search])

  const handleExpand = (chunk) => {
    if (expandedId === chunk.id) {
      setExpandedId(null)
      setEditState(null)
    } else {
      setExpandedId(chunk.id)
      setEditState({
        excerpt: chunk.excerpt || '',
        full_text: chunk.full_text || '',
        audience: chunk.audience || '',
        tone: chunk.tone || '',
        quality: chunk.quality || '',
        signature_moves: chunk.signature_moves || [],
        notes: chunk.notes || '',
      })
    }
  }

  const handleSave = async () => {
    if (!editState || !expandedId) return
    await upsert({ id: expandedId, ...editState })
    setExpandedId(null)
    setEditState(null)
    refetch()
  }

  const toggleMove = (move) => {
    setEditState(prev => ({
      ...prev,
      signature_moves: prev.signature_moves.includes(move)
        ? prev.signature_moves.filter(m => m !== move)
        : [...prev.signature_moves, move],
    }))
  }

  if (loading) return <Spinner />
  if (error) return <p className="text-[var(--error)]">Error: {error}</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)]">Voice Chunks</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">{filtered.length} of {chunks.length} chunks</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="Search chunks..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] text-sm flex-1 min-w-[200px]"
        />
        <FilterSelect label="Audience" value={filters.audience} options={AUDIENCE_OPTIONS} onChange={v => setFilters(f => ({ ...f, audience: v }))} />
        <FilterSelect label="Tone" value={filters.tone} options={TONE_OPTIONS} onChange={v => setFilters(f => ({ ...f, tone: v }))} />
        <FilterSelect label="Quality" value={filters.quality} options={QUALITY_OPTIONS} onChange={v => setFilters(f => ({ ...f, quality: v }))} />
        <FilterSelect label="Signature Move" value={filters.signature_move} options={SIGNATURE_MOVE_OPTIONS} onChange={v => setFilters(f => ({ ...f, signature_move: v }))} />
      </div>

      {/* Chunk list */}
      <div className="space-y-2">
        {filtered.map(chunk => {
          const isExpanded = expandedId === chunk.id
          const qualityColor = QUALITY_COLORS[chunk.quality] || QUALITY_COLORS.usable
          const audienceColor = AUDIENCE_COLORS[chunk.audience] || AUDIENCE_COLORS.general
          const toneColor = TONE_COLORS[chunk.tone] || TONE_COLORS.analytical

          return (
            <div key={chunk.id} className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
              <button
                onClick={() => handleExpand(chunk)}
                className="w-full text-left px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold font-heading text-[var(--text-primary)] truncate">
                      {chunk.excerpt || 'Untitled Chunk'}
                    </h3>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1 line-clamp-2">
                      {(chunk.full_text || '').slice(0, 150)}...
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                    <Badge label={formatEnumLabel(chunk.audience)} bg={audienceColor.bg} text={audienceColor.text} />
                    <Badge label={formatEnumLabel(chunk.tone)} bg={toneColor.bg} text={toneColor.text} />
                    <Badge label={formatEnumLabel(chunk.quality)} bg={qualityColor.bg} text={qualityColor.text} />
                    {(chunk.signature_moves || []).map(move => {
                      const moveColor = SIGNATURE_MOVE_COLORS[move] || SIGNATURE_MOVE_COLORS.rhetorical_question
                      return <Badge key={move} label={formatEnumLabel(move)} bg={moveColor.bg} text={moveColor.text} />
                    })}
                    <span className="text-xs text-[var(--text-tertiary)] font-mono ml-2">
                      {chunk.times_used || 0}x used
                    </span>
                  </div>
                </div>
                {chunk.writing_samples?.title && (
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    Source: {chunk.writing_samples.title}
                  </p>
                )}
              </button>

              {isExpanded && editState && (
                <div className="px-4 pb-4 pt-2 border-t border-[var(--border)] space-y-3">
                  <div>
                    <label className="block text-xs text-[var(--text-tertiary)] mb-1 font-sans">Excerpt (Title)</label>
                    <input
                      type="text"
                      value={editState.excerpt}
                      onChange={e => setEditState(s => ({ ...s, excerpt: e.target.value }))}
                      className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--text-tertiary)] mb-1 font-sans">Full Text</label>
                    <textarea
                      value={editState.full_text}
                      onChange={e => setEditState(s => ({ ...s, full_text: e.target.value }))}
                      rows={6}
                      className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
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
                    <div>
                      <label className="block text-xs text-[var(--text-tertiary)] mb-1 font-sans">Tone</label>
                      <select
                        value={editState.tone}
                        onChange={e => setEditState(s => ({ ...s, tone: e.target.value }))}
                        className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm"
                      >
                        {TONE_OPTIONS.map(o => <option key={o} value={o}>{formatEnumLabel(o)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--text-tertiary)] mb-1 font-sans">Quality</label>
                      <select
                        value={editState.quality}
                        onChange={e => setEditState(s => ({ ...s, quality: e.target.value }))}
                        className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm"
                      >
                        {QUALITY_OPTIONS.map(o => <option key={o} value={o}>{formatEnumLabel(o)}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--text-tertiary)] mb-1 font-sans">Signature Moves</label>
                    <div className="flex flex-wrap gap-2">
                      {SIGNATURE_MOVE_OPTIONS.map(move => {
                        const selected = editState.signature_moves.includes(move)
                        const moveColor = SIGNATURE_MOVE_COLORS[move]
                        return (
                          <button
                            key={move}
                            onClick={() => toggleMove(move)}
                            className={`px-2.5 py-1 rounded text-xs font-medium transition-opacity ${selected ? 'opacity-100' : 'opacity-30'}`}
                            style={{ backgroundColor: moveColor.bg, color: moveColor.text }}
                          >
                            {formatEnumLabel(move)}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--text-tertiary)] mb-1 font-sans">Notes</label>
                    <input
                      type="text"
                      value={editState.notes}
                      onChange={e => setEditState(s => ({ ...s, notes: e.target.value }))}
                      className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => { setExpandedId(null); setEditState(null) }}
                      className="px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-sans"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-1.5 bg-[var(--accent)] text-white text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50 font-sans"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FilterSelect({ label, value, options, onChange }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="px-2 py-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] text-xs font-sans"
    >
      <option value="">{label}: All</option>
      {options.map(o => <option key={o} value={o}>{formatEnumLabel(o)}</option>)}
    </select>
  )
}
