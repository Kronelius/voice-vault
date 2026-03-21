/**
 * Prompt builders for Voice Vault AI endpoints.
 * Each returns { system, user } strings for the Anthropic API.
 */

export function buildReviewPrompt(voiceProfile, originalMd, editedMd, contentMeta) {
  const system = voiceProfile.system_prompt || 'You are an expert writing coach and voice analyst.'

  const audience = contentMeta.audience || 'general'
  const readingTargets = voiceProfile.reading_level_targets?.[audience]
  const signatureMoves = (voiceProfile.signature_moves_config || [])
    .map(m => `- ${m.pattern}: ${m.description}`).join('\n')

  const user = `You are reviewing edits to an article. Analyze how well the changes align with the author's voice profile and targets.

## Article: ${contentMeta.title || 'Untitled'}
## Target Audience: ${audience}
## Target FK Grade: ${contentMeta.fk_grade_target || 'not set'}
## Target Contraction Rate: ${contentMeta.contraction_rate_target || 'not set'}

${readingTargets ? `## Reading Level Rules for ${audience}:\n${JSON.stringify(readingTargets, null, 2)}` : ''}

## Signature Moves:
${signatureMoves || 'None defined'}

## Original Text:
${originalMd}

## Edited Text:
${editedMd}

## Instructions:
Respond with a JSON object containing:
- "summary": 1-2 sentence overall assessment
- "voice_alignment_score": 0-100 integer
- "strengths": array of specific things done well (2-4 items)
- "concerns": array of specific issues (0-4 items)
- "suggestions": array of actionable improvement ideas (1-3 items)
- "metrics_assessment": object with "grade_level", "contractions", "sentence_length" — each with "status" (on_target/above/below) and "note" string

Return ONLY valid JSON, no markdown fences or commentary.`

  return { system, user }
}

export function buildGradeAdjustPrompt(voiceProfile, markdown, targetGrade, audience, contractionTarget) {
  // Use a neutral system prompt — NOT the voice profile's system_prompt
  // The voice profile often says "keep it simple" which conflicts with raising grade levels
  const system = 'You are an expert editor specializing in readability adjustments. Your job is to rewrite text to hit a specific Flesch-Kincaid Grade Level target. The grade level target is your PRIMARY objective — it takes absolute priority over any other style guidance.'

  const vocab = voiceProfile.vocabulary || {}
  const signatureMoves = (voiceProfile.signature_moves_config || [])
    .map(m => `- ${m.pattern}: ${m.description}`).join('\n')

  const user = `Rewrite the following article to target Flesch-Kincaid Grade Level ${targetGrade} for a ${audience || 'general'} audience.

## CRITICAL — How Flesch-Kincaid Grade Level Works:
FK Grade = 0.39 × (total words / total sentences) + 11.8 × (total syllables / total words) − 15.59

The two levers are:
1. AVERAGE SENTENCE LENGTH (words per sentence) — this is the BIGGEST lever
2. AVERAGE SYLLABLES PER WORD — using multi-syllable vs single-syllable words

Target benchmarks by grade level:
- Grade 5: ~12 words/sentence, ~1.3 syllables/word
- Grade 8: ~17 words/sentence, ~1.5 syllables/word
- Grade 10: ~20 words/sentence, ~1.6 syllables/word
- Grade 12: ~23 words/sentence, ~1.7 syllables/word

To RAISE the grade: combine short sentences into longer compound/complex sentences, use more multi-syllable words (e.g. "use" → "utilize", "help" → "assistance", "show" → "demonstrate")
To LOWER the grade: break long sentences into shorter ones, replace complex words with simple ones

${contractionTarget ? `## Contraction Target: ${contractionTarget}` : ''}

## Vocabulary Preferences (secondary to grade target):
- Favor: ${(vocab.favorites || []).join(', ') || 'none specified'}
- Avoid: ${(vocab.avoid || []).join(', ') || 'none specified'}
- Transitions: ${(vocab.transitions || []).join(', ') || 'none specified'}

## Signature Moves (preserve when possible):
${signatureMoves || 'None defined'}

## Current Article:
${markdown}

## Instructions:
REWRITE this article to hit FK Grade Level ${targetGrade}. This is currently around grade 5 with very short sentences (~10 words/sentence). To reach grade ${targetGrade}, you MUST:
- Combine short sentences into longer, more sophisticated ones
- Target approximately ${targetGrade <= 6 ? '12' : targetGrade <= 8 ? '17' : targetGrade <= 10 ? '20' : '23'} words per sentence on average
- Use more multi-syllable vocabulary where natural
- DO NOT just make tiny word swaps — fundamentally restructure sentence lengths

Preserve the argument structure, key points, and general tone. Maintain markdown formatting. Return ONLY the rewritten markdown — no commentary, no explanation.`

  return { system, user }
}

export function buildChunkExtractionPrompt(voiceProfile, oldMarkdown, newMarkdown) {
  const system = 'You are a writing analyst studying a specific author\'s voice patterns.'

  const signatureMoves = (voiceProfile.signature_moves_config || [])
    .map(m => `- ${m.pattern}: ${m.description}`).join('\n')

  const user = `An author just edited an article. Compare the old and new versions to identify distinctive voice patterns worth preserving as reusable examples.

## Author's Known Signature Moves:
${signatureMoves || 'None defined yet'}

## Valid Categories:
- audience: sellers, investors, academic, general, professional
- tone: analytical, empathetic, educational, persuasive
- quality: strong, usable, weak
- signature_moves: ${(voiceProfile.signature_moves_config || []).map(m => m.pattern).join(', ') || 'none'}

## Previous Version:
${oldMarkdown}

## New Version:
${newMarkdown}

## Instructions:
Identify 0-5 noteworthy voice patterns, phrases, or stylistic choices in the NEW text that represent the author's distinctive voice and are worth saving as reusable examples. Focus on passages that exemplify signature moves, distinctive phrasing, or effective audience-appropriate language.

Return a JSON array of objects with:
- "excerpt": short label (5-10 words)
- "full_text": the actual passage (1-3 sentences)
- "audience": one of the valid audience values
- "tone": one of the valid tone values
- "quality": one of the valid quality values
- "signature_moves": array of matching signature move pattern names
- "notes": brief note on why this passage is noteworthy

Return [] if no patterns are notable enough to save. Return ONLY valid JSON, no markdown fences.`

  return { system, user }
}
