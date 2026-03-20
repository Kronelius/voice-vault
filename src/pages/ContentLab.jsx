import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { analyzeReadability } from '../lib/readability'
import { computeDiff } from '../lib/diff'
import { LAB_STATUS_COLORS, formatEnumLabel } from '../lib/constants'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'

/**
 * Content Lab — sandbox editor with inline diff preview.
 * Left pane: plain text editor (textarea).
 * Right pane: read-only diff preview showing deletions as red strikethrough
 * and insertions as red bold text, compared against the original body_markdown.
 */
export default function ContentLab() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [content, setContent] = useState(null)
  const [labText, setLabText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [committing, setCommitting] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [originalMetrics, setOriginalMetrics] = useState(null)
  const [labMetrics, setLabMetrics] = useState(null)
  const debounceRef = useRef(null)
  const textareaRef = useRef(null)
  const previewRef = useRef(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('generated_content')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        navigate('/')
        return
      }

      setContent(data)
      const text = data.lab_markdown || data.body_markdown || ''
      setLabText(text)
      setOriginalMetrics(analyzeReadability(data.body_markdown || ''))
      setLabMetrics(analyzeReadability(text))
      setLoading(false)
    }
    load()
  }, [id, navigate])

  const updateLabMetrics = useCallback((text) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setLabMetrics(analyzeReadability(text || ''))
    }, 500)
  }, [])

  const handleTextChange = (e) => {
    const value = e.target.value
    setLabText(value)
    updateLabMetrics(value)
    if (content.lab_status !== 'editing' && content.lab_status !== 'pending_review') {
      setContent(prev => ({ ...prev, lab_status: 'editing' }))
    }
  }

  /** Sync scroll between textarea and preview */
  const handleScroll = (e) => {
    if (previewRef.current) {
      const ratio = e.target.scrollTop / (e.target.scrollHeight - e.target.clientHeight || 1)
      previewRef.current.scrollTop = ratio * (previewRef.current.scrollHeight - previewRef.current.clientHeight)
    }
  }

  /** Compute diff between original and lab text */
  const diffOps = useMemo(() => {
    if (!content) return []
    return computeDiff(content.body_markdown || '', labText)
  }, [content?.body_markdown, labText])

  const handleSaveDraft = async () => {
    setSaving(true)
    setSaveMsg('')
    const status = content.lab_status === 'analyzed' ? 'analyzed' : 'editing'
    const { error } = await supabase
      .from('generated_content')
      .update({ lab_markdown: labText, lab_status: status })
      .eq('id', id)
    setContent(prev => ({ ...prev, lab_markdown: labText, lab_status: status }))
    setSaving(false)
    setSaveMsg(error ? `Error: ${error.message}` : 'Draft saved')
    setTimeout(() => setSaveMsg(''), 2000)
  }

  const handleRequestReview = async () => {
    setSaving(true)
    setSaveMsg('')
    const { error } = await supabase
      .from('generated_content')
      .update({ lab_markdown: labText, lab_status: 'pending_review' })
      .eq('id', id)
    setContent(prev => ({ ...prev, lab_markdown: labText, lab_status: 'pending_review' }))
    setSaving(false)
    setSaveMsg(error ? `Error: ${error.message}` : 'Sent for review')
    setTimeout(() => setSaveMsg(''), 2000)
  }

  const handleCommit = async () => {
    if (content.lab_status !== 'analyzed') return
    setCommitting(true)
    const m = analyzeReadability(labText)
    const newVersion = (content.version || 1) + 1
    const { error } = await supabase
      .from('generated_content')
      .update({
        body_markdown: labText,
        lab_markdown: null,
        lab_status: null,
        lab_analyzed_at: null,
        lab_notes: null,
        version: newVersion,
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
    setCommitting(false)
    if (error) {
      setSaveMsg(`Error: ${error.message}`)
    } else {
      navigate(`/content/${id}`)
    }
  }

  const handleDiscard = async () => {
    const { error } = await supabase
      .from('generated_content')
      .update({ lab_markdown: null, lab_status: null, lab_analyzed_at: null, lab_notes: null })
      .eq('id', id)
    if (!error) navigate(`/content/${id}`)
  }

  if (loading || !content) return <Spinner />

  const labStatusColor = LAB_STATUS_COLORS[content.lab_status] || LAB_STATUS_COLORS.editing
  const hasChanges = labText !== (content.body_markdown || '')

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => navigate(`/content/${id}`)}
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-sans"
        >
          &larr; Back to Editor
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-heading font-semibold text-[var(--text-primary)]">Lab</span>
          <span className="text-xs font-mono text-[var(--accent)] bg-[var(--accent-muted)] px-1.5 py-0.5 rounded">
            v{content.version || 1}.0
          </span>
          {content.lab_status && (
            <Badge label={formatEnumLabel(content.lab_status)} bg={labStatusColor.bg} text={labStatusColor.text} />
          )}
        </div>
        <div className="flex-1" />
        <span className="text-xs text-[var(--text-tertiary)]">{saveMsg}</span>
        <button onClick={handleDiscard} className="px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--error)] transition-colors font-sans">
          Discard
        </button>
        <button
          onClick={handleSaveDraft}
          disabled={saving}
          className="px-4 py-2 border border-[var(--border)] text-[var(--text-primary)] text-sm font-medium rounded-md hover:bg-[var(--bg-hover)] transition-all duration-200 disabled:opacity-50 font-sans"
        >
          {saving ? 'Saving...' : 'Save Draft'}
        </button>
        {content.lab_status !== 'analyzed' && (
          <button
            onClick={handleRequestReview}
            disabled={saving || !hasChanges}
            className="px-4 py-2 bg-[var(--secondary)] text-white text-sm font-medium rounded-md hover:opacity-90 transition-all duration-200 disabled:opacity-50 font-sans"
          >
            Request Review
          </button>
        )}
        {content.lab_status === 'analyzed' && (
          <button
            onClick={handleCommit}
            disabled={committing}
            className="px-4 py-2 bg-[var(--success)] text-white text-sm font-medium rounded-md hover:opacity-90 transition-all duration-200 disabled:opacity-50 font-sans"
          >
            {committing ? 'Committing...' : 'Commit Changes'}
          </button>
        )}
      </div>

      {/* Title */}
      <h2 className="text-lg font-heading font-semibold text-[var(--text-primary)]">
        {content.title || 'Untitled'}
      </h2>

      {/* Analysis notes */}
      {content.lab_notes && (
        <div className="p-4 rounded-lg border border-[var(--success)] bg-[#2EAD6A10]">
          <h3 className="text-xs font-semibold font-heading text-[var(--success)] mb-2 uppercase tracking-wide">
            Analysis Notes
          </h3>
          <div className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
            {content.lab_notes}
          </div>
          {content.lab_analyzed_at && (
            <p className="text-xs text-[var(--text-tertiary)] mt-2 font-mono">
              Analyzed {new Date(content.lab_analyzed_at).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Editor + Diff Preview + Metrics */}
      <div className="flex gap-4">
        {/* Left: Plain text editor */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="text-xs font-semibold font-heading text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
            Edit
          </div>
          <textarea
            ref={textareaRef}
            value={labText}
            onChange={handleTextChange}
            onScroll={handleScroll}
            spellCheck
            className="flex-1 w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] text-sm font-mono leading-relaxed resize-none focus:border-[var(--accent)] focus:shadow-[var(--shadow-glow)] focus:outline-none transition-all duration-200"
            style={{ minHeight: 560 }}
          />
        </div>

        {/* Center: Diff preview (read-only) */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="text-xs font-semibold font-heading text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
            Changes Preview
          </div>
          <div
            ref={previewRef}
            className="flex-1 w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-sm leading-relaxed overflow-y-auto"
            style={{ minHeight: 560 }}
          >
            {diffOps.length === 0 ? (
              <span className="text-[var(--text-tertiary)] italic">No changes yet. Start editing on the left.</span>
            ) : (
              <DiffDisplay ops={diffOps} />
            )}
          </div>
        </div>

        {/* Right: Metrics sidebar */}
        <div className="w-56 shrink-0 space-y-4">
          {labMetrics && originalMetrics && (
            <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] shadow-sm">
              <h3 className="text-xs font-semibold font-heading text-[var(--accent)] mb-2 uppercase tracking-wide">
                Metrics
              </h3>
              <div className="space-y-1">
                <MetricDelta label="FK Grade" original={originalMetrics.fkGrade} lab={labMetrics.fkGrade} lowerIsBetter />
                <MetricDelta label="Reading Ease" original={originalMetrics.readingEase} lab={labMetrics.readingEase} />
                <MetricDelta label="Avg Sentence" original={originalMetrics.avgSentenceLength} lab={labMetrics.avgSentenceLength} lowerIsBetter />
                <MetricDelta label="Complex Words" original={originalMetrics.complexWordPct} lab={labMetrics.complexWordPct} lowerIsBetter suffix="%" />
                <MetricDelta label="Contractions" original={originalMetrics.contractionRate} lab={labMetrics.contractionRate} suffix="%" />
                <MetricDelta label="Word Count" original={originalMetrics.wordCount} lab={labMetrics.wordCount} />
              </div>
            </div>
          )}

          <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] shadow-sm">
            <h3 className="text-xs font-semibold font-heading text-[var(--text-primary)] mb-2 uppercase tracking-wide">
              Lab Status
            </h3>
            <div className="space-y-2">
              <LabStep label="Edit copy" done={hasChanges || !!content.lab_status} active={content.lab_status === 'editing' || (!content.lab_status && hasChanges)} />
              <LabStep label="Request review" done={content.lab_status === 'pending_review' || content.lab_status === 'analyzed'} active={content.lab_status === 'pending_review'} />
              <LabStep label="Analyzed by Claude" done={content.lab_status === 'analyzed'} active={false} />
              <LabStep label="Commit changes" done={false} active={content.lab_status === 'analyzed'} />
            </div>
          </div>

          {/* Legend */}
          <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] shadow-sm">
            <h3 className="text-xs font-semibold font-heading text-[var(--text-primary)] mb-2 uppercase tracking-wide">
              Legend
            </h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#E04B5A]">red bold</span>
                <span className="text-[var(--text-tertiary)]">= added text</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="line-through text-[#E04B5A] bg-[#E04B5A15] px-1 rounded">strikethrough</span>
                <span className="text-[var(--text-tertiary)]">= removed text</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Renders the diff operations as styled inline spans */
function DiffDisplay({ ops }) {
  return (
    <div className="whitespace-pre-wrap font-sans text-[var(--text-primary)]">
      {ops.map((op, i) => {
        if (op.type === 'equal') {
          return <span key={i}>{op.text} </span>
        }
        if (op.type === 'delete') {
          return (
            <span
              key={i}
              className="line-through font-bold bg-[#E04B5A15] rounded px-0.5"
              style={{ color: '#E04B5A' }}
            >
              {op.text}
            </span>
          )
        }
        if (op.type === 'insert') {
          return (
            <span
              key={i}
              className="font-bold"
              style={{ color: '#E04B5A' }}
            >
              {op.text}{' '}
            </span>
          )
        }
        return null
      })}
    </div>
  )
}

function MetricDelta({ label, original, lab, lowerIsBetter = false, suffix = '' }) {
  const delta = Math.round((lab - original) * 10) / 10
  const isImproved = lowerIsBetter ? delta < 0 : delta > 0
  const isWorsened = lowerIsBetter ? delta > 0 : delta < 0
  const deltaColor = delta === 0
    ? 'text-[var(--text-tertiary)]'
    : isImproved ? 'text-[#2EAD6A]' : isWorsened ? 'text-[#E04B5A]' : 'text-[var(--text-tertiary)]'
  const arrow = delta > 0 ? '+' : ''

  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-xs text-[var(--text-secondary)] font-sans">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-mono text-[var(--text-tertiary)]">{original}{suffix}</span>
        <span className="text-xs text-[var(--text-tertiary)]">&rarr;</span>
        <span className="text-xs font-mono font-semibold text-[var(--text-primary)]">{lab}{suffix}</span>
        {delta !== 0 && (
          <span className={`text-xs font-mono font-semibold ${deltaColor}`}>
            ({arrow}{delta})
          </span>
        )}
      </div>
    </div>
  )
}

function LabStep({ label, done, active }) {
  const dotClass = done
    ? 'bg-[#2EAD6A]'
    : active ? 'bg-[var(--accent)] animate-pulse' : 'bg-[var(--border)]'

  return (
    <div className="flex items-center gap-2">
      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotClass}`} />
      <span className={`text-xs font-sans ${done ? 'text-[#2EAD6A] font-medium' : active ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-tertiary)]'}`}>
        {label}{done && ' ✓'}
      </span>
    </div>
  )
}

function evaluateContractionPass(actual, target) {
  if (!target) return null
  const match = target.match(/(\d+)/)
  if (!match) return null
  return actual >= parseInt(match[1], 10)
}
