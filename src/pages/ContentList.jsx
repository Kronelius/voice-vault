import { useNavigate } from 'react-router-dom'
import { useSupabaseQuery, useSupabaseMutation } from '../hooks/useSupabase'
import { STATUS_COLORS, LAB_STATUS_COLORS, formatEnumLabel } from '../lib/constants'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'

/** Pastel backgrounds that rotate per card for post-it feel */
const NOTE_COLORS = [
  'var(--note-yellow)', 'var(--note-blue)', 'var(--note-green)',
  'var(--note-pink)', 'var(--note-orange)', 'var(--note-purple)',
]

export default function ContentList() {
  const navigate = useNavigate()
  const { data: content, loading, error, refetch } = useSupabaseQuery('generated_content', {
    orderBy: 'updated_at',
  })
  const { insert, remove } = useSupabaseMutation('generated_content')

  const handleCreate = async () => {
    const result = await insert({
      title: 'Untitled Post',
      content_type: 'blog_post',
      status: 'draft',
      body_markdown: '',
    })
    if (result && result[0]) {
      navigate(`/content/${result[0].id}`)
    }
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!window.confirm('Delete this content? This cannot be undone.')) return
    const ok = await remove(id)
    if (ok) refetch()
  }

  if (loading) return <Spinner />
  if (error) return <p className="text-[var(--error)]">Error: {error}</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)]">Content</h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-1 italic">{content.length} pieces</p>
        </div>
        <button onClick={handleCreate} className="sketch-btn sketch-btn-primary px-4 py-2 text-sm">
          + New Post
        </button>
      </div>

      <div className="grid gap-4">
        {content.map((item, idx) => {
          const statusColor = STATUS_COLORS[item.status] || STATUS_COLORS.draft
          const noteColor = NOTE_COLORS[idx % NOTE_COLORS.length]
          const tilt = idx % 3 === 0 ? 'rotate-[0.4deg]' : idx % 3 === 1 ? 'rotate-[-0.3deg]' : 'rotate-[0.1deg]'

          return (
            <button
              key={item.id}
              onClick={() => navigate(`/content/${item.id}`)}
              className={`note-card text-left w-full p-5 cursor-pointer ${tilt}`}
              style={{ backgroundColor: noteColor }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold font-heading text-[var(--text-primary)] truncate">
                      {item.title || 'Untitled'}
                    </h3>
                    <span className="text-xs font-mono text-[var(--accent)] bg-[var(--accent-muted)] px-1.5 py-0.5 rounded shrink-0"
                      style={{ border: '1.5px solid var(--accent)', borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
                      v{item.version || 1}.0
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge label={formatEnumLabel(item.status)} bg={statusColor.bg} text={statusColor.text} />
                    {item.lab_status && (
                      <Badge
                        label={`Lab: ${formatEnumLabel(item.lab_status)}`}
                        bg={LAB_STATUS_COLORS[item.lab_status]?.bg || '#8B7E6A'}
                        text="#fff"
                      />
                    )}
                    {item.target_keyword && (
                      <span className="text-xs text-[var(--text-tertiary)] font-mono">{item.target_keyword}</span>
                    )}
                    {item.content_type && (
                      <span className="text-xs text-[var(--text-tertiary)] italic">{formatEnumLabel(item.content_type)}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div className="flex items-center gap-4 text-xs font-mono text-[var(--text-secondary)]">
                    {item.word_count > 0 && (
                      <span>{item.word_count.toLocaleString()} words</span>
                    )}
                    {item.fk_grade_actual != null && (
                      <span className={item.readability_pass ? 'text-[var(--success)]' : 'text-[var(--error)]'}>
                        FK {item.fk_grade_actual}
                      </span>
                    )}
                    {item.contraction_rate_actual != null && (
                      <span className={item.contraction_pass ? 'text-[var(--success)]' : 'text-[var(--error)]'}>
                        {item.contraction_rate_actual}% contr.
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-tertiary)]">
                      {formatRelativeDate(item.updated_at || item.created_at)}
                    </span>
                    <button
                      onClick={(e) => handleDelete(e, item.id)}
                      className="text-xs text-[var(--text-tertiary)] hover:text-[var(--error)] transition-colors"
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {content.length === 0 && (
        <p className="text-center text-sm text-[var(--text-tertiary)] mt-12 italic">
          No content yet. Click "+ New Post" to get started.
        </p>
      )}
    </div>
  )
}

function formatRelativeDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)
  const diffHrs = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHrs < 24) return `${diffHrs}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
