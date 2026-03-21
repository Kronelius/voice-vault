import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { buildGradeAdjustPrompt } from './_lib/prompts.js'
import { computeCostCents } from './_lib/anthropic.js'

const MODEL = 'claude-sonnet-4-20250514'
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

export const config = { runtime: 'edge' }

export default async function handler(req) {
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })

  const { contentId, targetGrade } = await req.json()
  if (!contentId || !targetGrade) return new Response(JSON.stringify({ error: 'Missing contentId or targetGrade' }), { status: 400 })

  const start = Date.now()

  // Bootstrap supabase to read settings
  const bootstrapSupa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data: settingsRows } = await bootstrapSupa.from('app_settings').select('key, value')
  const settings = {}
  for (const row of (settingsRows || [])) { if (row.value) settings[row.key] = row.value }

  const apiKey = settings.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY
  const serviceKey = settings.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!apiKey) return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), { status: 500 })

  const anthropic = new Anthropic({ apiKey })
  const supabase = createClient(SUPABASE_URL, serviceKey || SUPABASE_ANON_KEY)

  try {
    const { data: content } = await supabase
      .from('generated_content').select('*').eq('id', contentId).single()
    if (!content) return new Response(JSON.stringify({ error: 'Content not found' }), { status: 404 })

    const { data: profile } = await supabase
      .from('voice_profiles').select('*').eq('is_active', true).limit(1).single()

    const markdown = content.lab_markdown || content.body_markdown || ''
    const audience = content.audience || 'general'

    const { system, user } = buildGradeAdjustPrompt(
      profile || {},
      markdown,
      targetGrade,
      audience,
      content.contraction_rate_target
    )

    const stream = await anthropic.messages.stream({
      model: MODEL,
      max_tokens: 4000,
      system,
      messages: [{ role: 'user', content: user }],
    })

    let inputTokens = 0
    let outputTokens = 0

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta?.text) {
              controller.enqueue(new TextEncoder().encode(event.delta.text))
            }
            if (event.type === 'message_delta' && event.usage) {
              outputTokens = event.usage.output_tokens
            }
          }

          const finalMessage = await stream.finalMessage()
          inputTokens = finalMessage.usage?.input_tokens || 0
          outputTokens = finalMessage.usage?.output_tokens || outputTokens

          const durationMs = Date.now() - start
          const costCents = computeCostCents(MODEL, inputTokens, outputTokens)
          supabase.from('ai_usage_log').insert({
            endpoint: '/api/adjust-grade',
            content_id: contentId,
            model: MODEL,
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            cost_cents: costCents,
            duration_ms: durationMs,
          }).then(() => {})

          controller.close()
        } catch (err) {
          controller.error(err)
        }
      }
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' },
    })
  } catch (err) {
    const durationMs = Date.now() - start
    await supabase.from('ai_usage_log').insert({
      endpoint: '/api/adjust-grade', content_id: contentId, model: MODEL,
      input_tokens: 0, output_tokens: 0, cost_cents: 0, duration_ms: durationMs, error: err.message,
    })
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
