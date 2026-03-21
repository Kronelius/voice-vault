import { getAnthropicClient, getSupabaseAdmin, computeCostCents, logUsage } from './_lib/anthropic.js'
import { buildChunkExtractionPrompt } from './_lib/prompts.js'

const MODEL = 'claude-sonnet-4-20250514'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { contentId, oldMarkdown, newMarkdown } = req.body
  if (!contentId || !oldMarkdown || !newMarkdown) return res.status(400).json({ error: 'Missing required fields' })

  const start = Date.now()

  try {
    const anthropic = await getAnthropicClient()
    const supabaseAdmin = await getSupabaseAdmin()

    const { data: profile } = await supabaseAdmin
      .from('voice_profiles').select('*').eq('is_active', true).limit(1).single()

    const { system, user } = buildChunkExtractionPrompt(profile || {}, oldMarkdown, newMarkdown)

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system,
      messages: [{ role: 'user', content: user }],
    })

    const rawText = response.content[0]?.text || '[]'
    let chunks
    try {
      const cleaned = rawText.replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '')
      chunks = JSON.parse(cleaned)
    } catch {
      chunks = []
    }

    if (!Array.isArray(chunks)) chunks = []

    let chunksCreated = 0
    for (const chunk of chunks) {
      if (!chunk.excerpt || !chunk.full_text) continue
      const { error } = await supabaseAdmin.from('voice_chunks').insert({
        excerpt: chunk.excerpt,
        full_text: chunk.full_text,
        audience: chunk.audience || 'general',
        tone: chunk.tone || 'analytical',
        quality: chunk.quality || 'usable',
        signature_moves: chunk.signature_moves || [],
        notes: chunk.notes || '',
        source_content_id: contentId,
        times_used: 0,
      })
      if (!error) chunksCreated++
    }

    const durationMs = Date.now() - start
    const costCents = computeCostCents(MODEL, response.usage.input_tokens, response.usage.output_tokens)
    await logUsage({
      endpoint: '/api/extract-chunks',
      contentId,
      model: MODEL,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      costCents,
      durationMs,
    })

    return res.status(200).json({ success: true, chunksCreated })
  } catch (err) {
    const durationMs = Date.now() - start
    await logUsage({ endpoint: '/api/extract-chunks', contentId, model: MODEL, inputTokens: 0, outputTokens: 0, costCents: 0, durationMs, error: err.message })
    return res.status(200).json({ success: false, error: err.message, chunksCreated: 0 })
  }
}
