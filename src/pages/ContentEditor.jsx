import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MDEditor from '@uiw/react-md-editor'
import { supabase } from '../lib/supabase'
import { analyzeReadability } from '../lib/readability'
import { STATUS_COLORS, LAB_STATUS_COLORS, STATUS_OPTIONS, formatEnumLabel } from '../lib/constants'
import MetricIndicator from '../components/ui/MetricIndicator'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'

export default function ContentEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [content, setContent] = useState(null)
  const [seo, setSeo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [metrics, setMetrics] = useState(null)
  const [seoOpen, setSeoOpen] = useState(false)
  const debounceRef = useRef(null)

  // Load content and SEO data
  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: contentData, error: contentErr } = await supabase
        .from('generated_content')
        .select('*')
        .eq('id', id)
        .single()

      if (contentErr || !contentData) {
        navigate('/')
        return
      }

      const { data: seoData } = await supabase
        .from('seo_metadata')
        .select('*')
        .eq('content_id', id)
        .limit(1)
        .single()

      setContent(contentData)
      setSeo(seoData || { content_id: id, title_tag: '', meta_description: '', primary_keyword: '', strengths: [], improvements: [] })
      setMetrics(analyzeReadability(contentData.body_markdown || ''))
      setLoading(false)
    }
    load()
  }, [id, navigate])

  // Debounced readability calculation
  const updateMetrics = useCallback((markdown) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setMetrics(analyzeReadability(markdown || ''))
    }, 500)
  }, [])

  const handleMarkdownChange = (value) => {
    setContent(prev => ({ ...prev, body_markdown: value }))
    updateMetrics(value)
  }

  const handleFieldChange = (field, value) => {
    setContent(prev => ({ ...prev, [field]: value }))
  }

  const handleSeoChange = (field, value) => {
    setSeo(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveMsg('')

    const m = metrics || analyzeReadability(content.body_markdown || '')

    const { error: contentErr } = await supabase
      .from('generated_content')
      .update({
        title: content.title,
        status: content.status,
        target_keyword: content.target_keyword,
        content_type: content.content_type,
        body_markdown: content.body_markdown,
        word_count: m.wordCount,
        fk_grade_actual: m.fkGrade,
        avg_sentence_length: m.avgSentenceLength,
        complex_word_pct: m.complexWordPct,
        contraction_rate_actual: m.contractionRate,
        readability_pass: content.fk_grade_target ? m.fkGrade <= content.fk_grade_target : null,
        contraction_pass: content.contraction_rate_target
          ? evaluateContractionPass(m.contractionRate, content.contraction_rate_target)
          : null,
      })
      .eq('id', id)

    // Save SEO metadata
    if (seo && (seo.title_tag || seo.meta_description || seo.primary_keyword)) {
      await supabase.from('seo_metadata').upsert({
        ...seo,
        content_id: id,
      }, { onConflict: 'content_id' })
    }

    setSaving(false)
    setSaveMsg(contentErr ? `Error: ${contentErr.message}` : 'Saved')
    setTimeout(() => setSaveMsg(''), 2000)
  }

  if (loading || !content) return <Spinner />

  const statusColor = STATUS_COLORS[content.status] || STATUS_COLORS.draft

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-sans"
        >
          &larr; Back
        </button>
        <div className="flex-1" />
        <span className="text-xs text-[var(--text-tertiary)]">{saveMsg}</span>
        {content.lab_status && (
          <Badge
            label={`Lab: ${formatEnumLabel(content.lab_status)}`}
            bg={LAB_STATUS_COLORS[content.lab_status]?.bg || '#7B8098'}
            text="#fff"
          />
        )}
        <button
          onClick={() => navigate(`/content/${id}/lab`)}
          className="px-4 py-2 border border-[var(--accent)] text-[var(--accent)] text-sm font-medium rounded-md hover:bg-[var(--accent-muted)] transition-all duration-200 font-sans"
        >
          Open Lab
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-[var(--accent)] text-white text-sm font-medium rounded-md hover:bg-[var(--accent-hover)] transition-all duration-200 hover:shadow-md disabled:opacity-50 font-sans"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Meta fields */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-3 items-end">
        <div>
          <label className="block text-xs text-[var(--text-tertiary)] mb-1 font-sans">Title</label>
          <input
            type="text"
            value={content.title || ''}
            onChange={e => handleFieldChange('title', e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] text-sm font-heading font-semibold"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--text-tertiary)] mb-1 font-sans">Status</label>
          <select
            value={content.status || 'draft'}
            onChange={e => handleFieldChange('status', e.target.value)}
            className="px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] text-sm font-sans"
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{formatEnumLabel(s)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-[var(--text-tertiary)] mb-1 font-sans">Type</label>
          <input
            type="text"
            value={content.content_type || ''}
            onChange={e => handleFieldChange('content_type', e.target.value)}
            className="px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] text-sm font-sans w-32"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--text-tertiary)] mb-1 font-sans">Target Keyword</label>
          <input
            type="text"
            value={content.target_keyword || ''}
            onChange={e => handleFieldChange('target_keyword', e.target.value)}
            className="px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] text-sm font-mono w-48"
          />
        </div>
      </div>

      {/* Editor + Sidebar */}
      <div className="flex gap-4">
        {/* Markdown editor */}
        <div className="flex-1 min-w-0" data-color-mode={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}>
          <MDEditor
            value={content.body_markdown || ''}
            onChange={handleMarkdownChange}
            height={560}
            preview="live"
          />
        </div>

        {/* Readability Sidebar */}
        <div className="w-56 shrink-0 space-y-4">
          <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] shadow-sm">
            <h3 className="text-xs font-semibold font-heading text-[var(--text-primary)] mb-2 uppercase tracking-wide">
              Readability
            </h3>
            {metrics && (
              <div className="space-y-0.5">
                <MetricIndicator
                  label="FK Grade"
                  value={metrics.fkGrade}
                  target={content.fk_grade_target}
                  pass={content.fk_grade_target ? metrics.fkGrade <= content.fk_grade_target : undefined}
                />
                <MetricIndicator
                  label="Reading Ease"
                  value={metrics.readingEase}
                />
                <MetricIndicator
                  label="Avg Sentence"
                  value={`${metrics.avgSentenceLength} words`}
                />
                <MetricIndicator
                  label="Complex Words"
                  value={`${metrics.complexWordPct}%`}
                />
                <MetricIndicator
                  label="Contraction Rate"
                  value={`${metrics.contractionRate}%`}
                  target={content.contraction_rate_target}
                  pass={content.contraction_rate_target
                    ? evaluateContractionPass(metrics.contractionRate, content.contraction_rate_target)
                    : undefined}
                />
                <MetricIndicator
                  label="Word Count"
                  value={metrics.wordCount.toLocaleString()}
                />
              </div>
            )}
          </div>

          {/* Status badge */}
          <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] shadow-sm">
            <h3 className="text-xs font-semibold font-heading text-[var(--text-primary)] mb-2 uppercase tracking-wide">
              Status
            </h3>
            <Badge label={formatEnumLabel(content.status)} bg={statusColor.bg} text={statusColor.text} />
            {content.published_at && (
              <p className="text-xs text-[var(--text-tertiary)] mt-2 font-mono">
                Published {new Date(content.published_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* SEO Panel */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] shadow-sm">
        <button
          onClick={() => setSeoOpen(!seoOpen)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-heading font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors duration-200 rounded-lg"
        >
          SEO Metadata
          <span className="text-[var(--text-tertiary)]">{seoOpen ? '▾' : '▸'}</span>
        </button>
        {seoOpen && seo && (
          <div className="px-4 pb-4 space-y-3 border-t border-[var(--border)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
              <div>
                <label className="block text-xs text-[var(--text-tertiary)] mb-1 font-sans">Title Tag</label>
                <input
                  type="text"
                  value={seo.title_tag || ''}
                  onChange={e => handleSeoChange('title_tag', e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-tertiary)] mb-1 font-sans">Primary Keyword</label>
                <input
                  type="text"
                  value={seo.primary_keyword || ''}
                  onChange={e => handleSeoChange('primary_keyword', e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-tertiary)] mb-1 font-sans">Meta Description</label>
              <textarea
                value={seo.meta_description || ''}
                onChange={e => handleSeoChange('meta_description', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[var(--text-tertiary)] mb-1 font-sans">Strengths</label>
                <textarea
                  value={(seo.strengths || []).join('\n')}
                  onChange={e => handleSeoChange('strengths', e.target.value.split('\n').filter(Boolean))}
                  rows={3}
                  placeholder="One per line"
                  className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-tertiary)] mb-1 font-sans">Improvements</label>
                <textarea
                  value={(seo.improvements || []).join('\n')}
                  onChange={e => handleSeoChange('improvements', e.target.value.split('\n').filter(Boolean))}
                  rows={3}
                  placeholder="One per line"
                  className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs text-[var(--text-tertiary)] mb-1 font-sans">Notes</label>
        <textarea
          value={content.notes || ''}
          onChange={e => handleFieldChange('notes', e.target.value)}
          rows={2}
          className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] text-sm"
        />
      </div>
    </div>
  )
}

/**
 * Evaluate whether the contraction rate passes the target.
 * Target is a string like "high (80%+)" — extract the number.
 */
function evaluateContractionPass(actual, target) {
  if (!target) return null
  const match = target.match(/(\d+)/)
  if (!match) return null
  return actual >= parseInt(match[1], 10)
}
