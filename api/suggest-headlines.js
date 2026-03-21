import { getAnthropicClient, getSupabaseAdmin, computeCostCents, logUsage } from './_lib/anthropic.js'

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

    // Fetch active voice profile
    const { data: profile } = await supabaseAdmin
      .from('voice_profiles').select('*').eq('is_active', true).limit(1).single()

    const draft = content.lab_markdown || content.body_markdown || ''
    const signatureMoves = (profile?.signature_moves_config || [])
      .map(m => `- ${m.pattern}: ${m.description}`).join('\n')

    const system = profile?.system_prompt || 'You are an expert editor and headline writer.'
    const user = `Generate 5 compelling headline alternatives for this article. Each headline should:
- Match the author's voice and tone
- Be attention-grabbing and clear
- Work for the target audience: ${content.audience || 'general'}

## Author's Signature Moves:
${signatureMoves || 'None defined'}

## Current Title: ${content.title || 'Untitled'}

## Article Content:
${draft.slice(0, 3000)}

## Instructions:
Return a JSON array of 5 headline strings. No commentary, no numbering — just a JSON array of strings.
Example: ["Headline One", "Headline Two", ...]`

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 500,
      system,
      messages: [{ role: 'user', content: user }],
    })

    const rawText = response.content[0]?.text || '[]'
    let headlines
    try {
      const cleaned = rawText.replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '')
      headlines = JSON.parse(cleaned)
    } catch {
      headlines = [rawText]
    }

    // Log usage
    const durationMs = Date.now() - start
    const costCents = computeCostCents(MODEL, response.usage.input_tokens, response.usage.output_tokens)
    await logUsage({
      endpoint: '/api/suggest-headlines',
      contentId,
      model: MODEL,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      costCents,
      durationMs,
    })

    return res.status(200).json({ success: true, headlines })
  } catch (err) {
    const durationMs = Date.now() - start
    await logUsage({ endpoint: '/api/suggest-headlines', contentId, model: MODEL, inputTokens: 0, outputTokens: 0, costCents: 0, durationMs, error: err.message })
    return res.status(500).json({ error: err.message })
  }
}
