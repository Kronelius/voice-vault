import { getAnthropicClient, getSupabaseAdmin, computeCostCents, logUsage } from './_lib/anthropic.js'
import { buildReviewPrompt } from './_lib/prompts.js'

const MODEL = 'claude-sonnet-4-20250514'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { contentId } = req.body
  if (!contentId) return res.status(400).json({ error: 'Missing contentId' })

  const start = Date.now()

  try {
    const anthropic = await getAnthropicClient()
    const supabaseAdmin = await getSupabaseAdmin()

    // Fetch content
    const { data: content, error: contentErr } = await supabaseAdmin
      .from('generated_content').select('*').eq('id', contentId).single()
    if (contentErr || !content) return res.status(404).json({ error: 'Content not found' })
    if (content.lab_status !== 'pending_review') return res.status(400).json({ error: 'Content is not pending review' })

    // Fetch active voice profile
    const { data: profile } = await supabaseAdmin
      .from('voice_profiles').select('*').eq('is_active', true).limit(1).single()

    const { system, user } = buildReviewPrompt(
      profile || {},
      content.body_markdown || '',
      content.lab_markdown || '',
      { title: content.title, audience: content.audience, fk_grade_target: content.fk_grade_target, contraction_rate_target: content.contraction_rate_target }
    )

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system,
      messages: [{ role: 'user', content: user }],
    })

    const rawText = response.content[0]?.text || ''
    let parsed
    try {
      const cleaned = rawText.replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '')
      parsed = JSON.parse(cleaned)
    } catch {
      parsed = { summary: rawText, voice_alignment_score: null, strengths: [], concerns: [], suggestions: [], metrics_assessment: {} }
    }

    // Format as readable text for lab_notes
    const lines = []
    if (parsed.summary) lines.push(parsed.summary)
    if (parsed.voice_alignment_score != null) lines.push(`\nVoice Alignment Score: ${parsed.voice_alignment_score}/100`)
    if (parsed.strengths?.length) lines.push(`\nStrengths:\n${parsed.strengths.map(s => `  • ${s}`).join('\n')}`)
    if (parsed.concerns?.length) lines.push(`\nConcerns:\n${parsed.concerns.map(c => `  • ${c}`).join('\n')}`)
    if (parsed.suggestions?.length) lines.push(`\nSuggestions:\n${parsed.suggestions.map(s => `  • ${s}`).join('\n')}`)
    if (parsed.metrics_assessment) {
      const ma = parsed.metrics_assessment
      const metricLines = []
      if (ma.grade_level) metricLines.push(`  Grade Level: ${ma.grade_level.status} — ${ma.grade_level.note}`)
      if (ma.contractions) metricLines.push(`  Contractions: ${ma.contractions.status} — ${ma.contractions.note}`)
      if (ma.sentence_length) metricLines.push(`  Sentence Length: ${ma.sentence_length.status} — ${ma.sentence_length.note}`)
      if (metricLines.length) lines.push(`\nMetrics:\n${metricLines.join('\n')}`)
    }
    const formattedNotes = lines.join('\n')

    // Update content
    await supabaseAdmin.from('generated_content').update({
      lab_status: 'analyzed',
      lab_notes: formattedNotes,
      lab_analyzed_at: new Date().toISOString(),
    }).eq('id', contentId)

    // Log usage
    const durationMs = Date.now() - start
    const costCents = computeCostCents(MODEL, response.usage.input_tokens, response.usage.output_tokens)
    await logUsage({
      endpoint: '/api/review',
      contentId,
      model: MODEL,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      costCents,
      durationMs,
    })

    return res.status(200).json({ success: true, notes: formattedNotes })
  } catch (err) {
    // Reset status on failure
    try {
      const supabaseAdmin = await getSupabaseAdmin()
      await supabaseAdmin.from('generated_content').update({ lab_status: 'editing' }).eq('id', contentId)
    } catch {}

    const durationMs = Date.now() - start
    await logUsage({ endpoint: '/api/review', contentId, model: MODEL, inputTokens: 0, outputTokens: 0, costCents: 0, durationMs, error: err.message })

    return res.status(500).json({ error: err.message })
  }
}
