import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { computeCostCents } from './_lib/anthropic.js'

const MODEL = 'claude-sonnet-4-20250514'
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

export const config = { runtime: 'edge' }

export default async function handler(req) {
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })

  const { messages, systemPrompt } = await req.json()
  if (!messages || !messages.length) return new Response(JSON.stringify({ error: 'Missing messages' }), { status: 400 })

  const start = Date.now()

  // Read settings from Supabase
  const bootstrapSupa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data: settingsRows } = await bootstrapSupa.from('app_settings').select('key, value')
  const settings = {}
  for (const row of (settingsRows || [])) { if (row.value) settings[row.key] = row.value }

  const apiKey = settings.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY
  if (!apiKey) return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured. Go to Settings to add it.' }), { status: 500 })

  const serviceKey = settings.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabase = createClient(SUPABASE_URL, serviceKey || SUPABASE_ANON_KEY)

  const anthropic = new Anthropic({ apiKey })

  try {
    const stream = await anthropic.messages.stream({
      model: MODEL,
      max_tokens: 4000,
      system: systemPrompt || 'You are a helpful writing assistant.',
      messages,
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
            endpoint: '/api/chat',
            content_id: null,
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
      endpoint: '/api/chat', content_id: null, model: MODEL,
      input_tokens: 0, output_tokens: 0, cost_cents: 0, duration_ms: durationMs, error: err.message,
    })
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
