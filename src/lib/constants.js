/** Color mappings — warm analog palette with hand-drawn aesthetic */

export const STATUS_COLORS = {
  draft: { bg: '#C0623A', text: '#fff' },
  review: { bg: '#2B7CB5', text: '#fff' },
  approved: { bg: '#5A8A4A', text: '#fff' },
  published: { bg: '#6B5A8E', text: '#fff' },
  archived: { bg: '#8B7E6A', text: '#fff' },
}

export const LAB_STATUS_COLORS = {
  editing: { bg: '#D4944A', text: '#fff' },
  pending_review: { bg: '#2B7CB5', text: '#fff' },
  analyzed: { bg: '#5A8A4A', text: '#fff' },
}

export const TONE_COLORS = {
  analytical: { bg: '#2B7CB5', text: '#fff' },
  empathetic: { bg: '#B5426A', text: '#fff' },
  educational: { bg: '#5A8A4A', text: '#fff' },
  persuasive: { bg: '#C0623A', text: '#fff' },
}

export const AUDIENCE_COLORS = {
  sellers: { bg: '#C0623A', text: '#fff' },
  investors: { bg: '#2B7CB5', text: '#fff' },
  academic: { bg: '#6B5A8E', text: '#fff' },
  general: { bg: '#8B7E6A', text: '#fff' },
  professional: { bg: '#5A8A4A', text: '#fff' },
}

export const SIGNATURE_MOVE_COLORS = {
  rhetorical_question: { bg: '#2B7CB5', text: '#fff' },
  perhaps_emphasis: { bg: '#B5426A', text: '#fff' },
  define_before_build: { bg: '#5A8A4A', text: '#fff' },
  i_believe: { bg: '#C0623A', text: '#fff' },
  systemic_connector: { bg: '#6B5A8E', text: '#fff' },
}

export const QUALITY_COLORS = {
  strong: { bg: '#5A8A4A', text: '#fff' },
  usable: { bg: '#D4944A', text: '#fff' },
  weak: { bg: '#B5423A', text: '#fff' },
}

export const STATUS_OPTIONS = ['draft', 'review', 'approved', 'published', 'archived']
export const TONE_OPTIONS = ['analytical', 'empathetic', 'educational', 'persuasive']
export const AUDIENCE_OPTIONS = ['sellers', 'investors', 'academic', 'general', 'professional']
export const QUALITY_OPTIONS = ['strong', 'usable', 'weak']
export const SIGNATURE_MOVE_OPTIONS = [
  'rhetorical_question', 'perhaps_emphasis', 'define_before_build',
  'i_believe', 'systemic_connector',
]
export const SAMPLE_TYPE_OPTIONS = ['college_paper', 'blog_post', 'email', 'linkedin_post', 'other']

/** Format enum values for display (e.g. "rhetorical_question" → "Rhetorical Question") */
export function formatEnumLabel(value) {
  if (!value) return ''
  return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
