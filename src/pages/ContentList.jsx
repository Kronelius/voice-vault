import { useNavigate } from 'react-router-dom'
import { useSupabaseQuery, useSupabaseMutation } from '../hooks/useSupabase'
import { STATUS_COLORS, formatEnumLabel } from '../lib/constants'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'

export default function ContentList() {
  const navigate = useNavigate()
  const { data: content, loading, error, refetch } = useSupabaseQuery('generated_content', {
    orderBy: 'updated_at',
  })
  const { insert } = useSupabaseMutation('generated_content')

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

  if (loading) return <Spinner />
  if (error) return <p className="text-[var(--error)]">Error: {error}</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)]">Content</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">{content.length} pieces</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-[var(--accent)] text-white text-sm font-medium rounded-md hover:bg-[var(--accent-hover)] transition-all duration-200 hover:shadow-md font-sans"
        >
          + New Post
        </button>
      </div>

      <div className="grid gap-3">
        {content.map(item => {
          const statusColor = STATUS_COLORS[item.status] || STATUS_COLORS.draft
          return (
            <button
              key={item.id}
              onClick={() => navigate(`/content/${item.id}`)}
              className="text-left w-full p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--accent)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              style={{ boxShadow: 'var(--shadow-sm)' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold font-heading text-[var(--text-primary)] truncate">
                    {item.title || 'Untitled'}
                  </h3>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <Badge label={formatEnumLabel(item.status)} bg={statusColor.bg} text={statusColor.text} />
                    {item.target_keyword && (
                      <span className="text-xs text-[var(--text-tertiary)] font-mono">
                        {item.target_keyword}
                      </span>
                    )}
                    {item.content_type && (
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {formatEnumLabel(item.content_type)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 text-xs font-mono text-[var(--text-secondary)]">
                  {item.word_count > 0 && (
                    <span>{item.word_count.toLocaleString()} words</span>
                  )}
                  {item.fk_grade_actual != null && (
                    <span className={item.readability_pass ? 'text-[#2EAD6A]' : 'text-[#E04B5A]'}>
                      FK {item.fk_grade_actual}
                    </span>
                  )}
                  {item.contraction_rate_actual != null && (
                    <span className={item.contraction_pass ? 'text-[#2EAD6A]' : 'text-[#E04B5A]'}>
                      {item.contraction_rate_actual}% contr.
                    </span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {content.length === 0 && (
        <p className="text-center text-sm text-[var(--text-tertiary)] mt-12">
          No content yet. Click "+ New Post" to get started.
        </p>
      )}
    </div>
  )
}
