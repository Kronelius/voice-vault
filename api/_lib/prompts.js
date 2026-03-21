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
  const system = voiceProfile.system_prompt || 'You are an expert editor who preserves the author\'s unique voice.'

  const readingTargets = voiceProfile.reading_level_targets?.[audience || 'general']
  const vocab = voiceProfile.vocabulary || {}
  const signatureMoves = (voiceProfile.signature_moves_config || [])
    .map(m => `- ${m.pattern}: ${m.description}`).join('\n')

  const user = `Rewrite the following article to target Flesch-Kincaid Grade Level ${targetGrade} for a ${audience || 'general'} audience.

${contractionTarget ? `## Contraction Target: ${contractionTarget}` : ''}
${readingTargets ? `## Reading Level Rules:\n${JSON.stringify(readingTargets, null, 2)}` : ''}

## Vocabulary to Use: ${(vocab.favorites || []).join(', ') || 'none specified'}
## Vocabulary to Avoid: ${(vocab.avoid || []).join(', ') || 'none specified'}
## Preferred Transitions: ${(vocab.transitions || []).join(', ') || 'none specified'}

## Signature Moves (preserve these patterns):
${signatureMoves || 'None defined'}

## Current Article:
${markdown}

## Instructions:
Rewrite this article to hit FK Grade Level ${targetGrade}. Preserve the author's voice, signature moves, and argument structure. Maintain the same markdown formatting (headings, paragraphs, etc.). Return ONLY the rewritten markdown with no commentary or explanation.`

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
