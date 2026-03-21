import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import { supabase } from '../lib/supabase'
import { postApi, postApiStream } from '../lib/api'
import { analyzeReadability } from '../lib/readability'
import { computeDiffMarkdown } from '../lib/diff'
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
  const [reviewing, setReviewing] = useState(false)
  const [adjusting, setAdjusting] = useState(false)
  const [showGradeInput, setShowGradeInput] = useState(false)
  const [targetGrade, setTargetGrade] = useState('')
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
      setTargetGrade(data.fk_grade_target || '')
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

  /** Compute diff markdown — original vs lab with inline HTML diff markers */
  const diffMarkdown = useMemo(() => {
    if (!content) return ''
    const orig = content.body_markdown || ''
    if (labText === orig) return labText
    return computeDiffMarkdown(orig, labText)
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
    setReviewing(true)
    setSaveMsg('')

    // Save lab_markdown and set pending_review
    const { error: saveErr } = await supabase
      .from('generated_content')
      .update({ lab_markdown: labText, lab_status: 'pending_review' })
      .eq('id', id)

    if (saveErr) {
      setSaving(false)
      setReviewing(false)
      setSaveMsg(`Error: ${saveErr.message}`)
      setTimeout(() => setSaveMsg(''), 3000)
      return
    }

    setContent(prev => ({ ...prev, lab_markdown: labText, lab_status: 'pending_review' }))

    // Call the review API
    try {
      const result = await postApi('/api/review', { contentId: id })
      setContent(prev => ({
        ...prev,
        lab_status: 'analyzed',
        lab_notes: result.notes,
        lab_analyzed_at: new Date().toISOString(),
      }))
      setSaveMsg('Review complete')
    } catch (err) {
      setContent(prev => ({ ...prev, lab_status: 'editing' }))
      setSaveMsg(`Review failed: ${err.message}`)
    }

    setSaving(false)
    setReviewing(false)
    setTimeout(() => setSaveMsg(''), 3000)
  }

  const handleAdjustGrade = async () => {
    const grade = parseFloat(targetGrade)
    if (!grade || grade < 1 || grade > 16) {
      setSaveMsg('Enter a valid grade level (1-16)')
      setTimeout(() => setSaveMsg(''), 2000)
      return
    }

    setAdjusting(true)
    setShowGradeInput(false)
    setSaveMsg('Adjusting grade level...')

    // Save current lab text first
    await supabase.from('generated_content')
      .update({ lab_markdown: labText, lab_status: 'editing' })
      .eq('id', id)

    try {
      let streamedText = ''
      await postApiStream('/api/adjust-grade', { contentId: id, targetGrade: grade }, (chunk) => {
        streamedText += chunk
        setLabText(streamedText)
      })
      // Recalculate metrics
      updateLabMetrics(streamedText)
      // Save the result
      await supabase.from('generated_content')
        .update({ lab_markdown: streamedText, lab_status: 'editing' })
        .eq('id', id)
      setContent(prev => ({ ...prev, lab_markdown: streamedText, lab_status: 'editing' }))
      setSaveMsg('Grade adjustment complete')
    } catch (err) {
      setSaveMsg(`Adjust failed: ${err.message}`)
    }

    setAdjusting(false)
    setTimeout(() => setSaveMsg(''), 3000)
  }

  const handleCommit = async () => {
    if (content.lab_status !== 'analyzed') return
    setCommitting(true)
    const m = analyzeReadability(labText)
    const newVersion = (content.version || 1) + 1
    const oldMarkdown = content.body_markdown
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
      // Fire-and-forget: extract chunks from the changes
      postApi('/api/extract-chunks', { contentId: id, oldMarkdown, newMarkdown: labText }).catch(() => {})
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
        <button onClick={() => navigate(`/content/${id}`)}
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] font-sans font-semibold">
          &larr; Back to Editor
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-heading font-bold text-[var(--text-primary)]">Lab</span>
          <span className="text-xs font-mono text-[var(--accent)] bg-[var(--accent-muted)] px-1.5 py-0.5"
            style={{ border: '1.5px solid var(--accent)', borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
            v{content.version || 1}.0
          </span>
          {content.lab_status && (
            <Badge label={formatEnumLabel(content.lab_status)} bg={labStatusColor.bg} text={labStatusColor.text} />
          )}
        </div>
        <div className="flex-1" />
        <span className="text-xs text-[var(--text-tertiary)]">{saveMsg}</span>

        {/* Grade adjust controls */}
        {content.lab_status !== 'analyzed' && !reviewing && !adjusting && (
          showGradeInput ? (
            <div className="flex items-center gap-1">
              <input
                type="number" min="1" max="16" step="0.5"
                value={targetGrade} onChange={e => setTargetGrade(e.target.value)}
                placeholder="Grade"
                className="sketch-input px-2 py-1.5 text-sm font-mono w-20"
              />
              <button onClick={handleAdjustGrade} className="sketch-btn sketch-btn-primary px-3 py-1.5 text-xs">Go</button>
              <button onClick={() => setShowGradeInput(false)} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">Cancel</button>
            </div>
          ) : (
            <button onClick={() => setShowGradeInput(true)} className="sketch-btn sketch-btn-outline px-3 py-2 text-sm"
              style={{ borderColor: 'var(--secondary)', color: 'var(--secondary)' }}>
              Adjust Grade
            </button>
          )
        )}

        <button onClick={handleDiscard} className="sketch-btn sketch-btn-danger px-4 py-2 text-sm">Discard</button>
        <button onClick={handleSaveDraft} disabled={saving} className="sketch-btn sketch-btn-outline px-4 py-2 text-sm">
          {saving && !reviewing ? 'Saving...' : 'Save Draft'}
        </button>
        {content.lab_status !== 'analyzed' && (
          <button onClick={handleRequestReview} disabled={saving || reviewing || adjusting || !hasChanges}
            className="sketch-btn sketch-btn-blue px-4 py-2 text-sm">
            {reviewing ? 'Reviewing...' : 'Request Review'}
          </button>
        )}
        {content.lab_status === 'analyzed' && (
          <button onClick={handleCommit} disabled={committing}
            className="sketch-btn sketch-btn-green px-4 py-2 text-sm">{committing ? 'Committing...' : 'Commit Changes'}</button>
        )}
      </div>

      {/* Title */}
      <h2 className="text-lg font-heading font-semibold text-[var(--text-primary)]">
        {content.title || 'Untitled'}
      </h2>

      {/* Reviewing indicator */}
      {reviewing && (
        <div className="sketch-card p-4 flex items-center gap-3" style={{ backgroundColor: 'var(--note-blue)' }}>
          <span className="w-3 h-3 rounded-full bg-[var(--secondary)] animate-pulse" />
          <span className="text-sm text-[var(--text-primary)] font-sans">Claude is reviewing your changes...</span>
        </div>
      )}

      {/* Adjusting indicator */}
      {adjusting && (
        <div className="sketch-card p-4 flex items-center gap-3" style={{ backgroundColor: 'var(--note-blue)' }}>
          <span className="w-3 h-3 rounded-full bg-[var(--secondary)] animate-pulse" />
          <span className="text-sm text-[var(--text-primary)] font-sans">Claude is adjusting grade level...</span>
        </div>
      )}

      {/* Analysis notes */}
      {content.lab_notes && (
        <div className="sketch-card p-4" style={{ backgroundColor: 'var(--note-green)' }}>
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
      <div className="flex flex-col lg:flex-row gap-4">
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
            className="clean-input flex-1 w-full px-4 py-3 text-sm font-mono leading-relaxed resize-none"
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
            className="clean-card flex-1 w-full px-4 py-3 text-sm leading-relaxed overflow-y-auto lab-preview"
            style={{ minHeight: 560, backgroundColor: 'var(--bg-card)' }}
          >
            <ReactMarkdown rehypePlugins={[rehypeRaw]}>
              {diffMarkdown}
            </ReactMarkdown>
          </div>
        </div>

        {/* Right: Metrics sidebar */}
        <div className="w-full lg:w-56 lg:shrink-0 space-y-4 lg:pt-6">
          {labMetrics && originalMetrics && (
            <div className="sketch-card p-3" style={{ backgroundColor: 'var(--note-green)' }}>
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

          <div className="sketch-card p-3" style={{ backgroundColor: 'var(--note-blue)' }}>
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
          <div className="sketch-card p-3" style={{ backgroundColor: 'var(--note-yellow)' }}>
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
