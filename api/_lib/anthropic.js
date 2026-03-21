import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

// Bootstrap Supabase client — uses env vars (always available on Vercel)
// to read runtime config from app_settings table
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

const bootstrapSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Cache for settings to avoid repeated DB reads within a single function invocation
let settingsCache = null

async function getSettings() {
  if (settingsCache) return settingsCache
  const { data } = await bootstrapSupabase.from('app_settings').select('key, value')
  settingsCache = {}
  for (const row of (data || [])) {
    if (row.value) settingsCache[row.key] = row.value
  }
  return settingsCache
}

export async function getAnthropicClient() {
  const settings = await getSettings()
  const apiKey = settings.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured. Set it in Voice Vault Settings.')
  return new Anthropic({ apiKey })
}

export async function getSupabaseAdmin() {
  const settings = await getSettings()
  const serviceKey = settings.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured. Set it in Voice Vault Settings.')
  return createClient(SUPABASE_URL, serviceKey)
}

// Sonnet pricing: $3/M input, $15/M output
const MODEL_PRICING = {
  'claude-sonnet-4-20250514': { inputPer1M: 3, outputPer1M: 15 },
}

export function computeCostCents(model, inputTokens, outputTokens) {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['claude-sonnet-4-20250514']
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPer1M * 100
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPer1M * 100
  return Math.round((inputCost + outputCost) * 10000) / 10000
}

export async function logUsage({ endpoint, contentId, model, inputTokens, outputTokens, costCents, durationMs, error }) {
  try {
    const admin = await getSupabaseAdmin()
    await admin.from('ai_usage_log').insert({
      endpoint,
      content_id: contentId,
      model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_cents: costCents,
      duration_ms: durationMs,
      error: error || null,
    })
  } catch {
    // Don't fail the main request if logging fails
  }
}
