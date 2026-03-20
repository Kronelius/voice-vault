/** Color mappings for tags and badges throughout the app */

export const STATUS_COLORS = {
  draft: { bg: '#9E6B3A', text: '#fff' },
  review: { bg: '#3D5A80', text: '#fff' },
  approved: { bg: '#4A7C59', text: '#fff' },
  published: { bg: '#2B6CB0', text: '#fff' },
  archived: { bg: '#6B6560', text: '#fff' },
}

export const TONE_COLORS = {
  analytical: { bg: '#3D5A80', text: '#fff' },
  empathetic: { bg: '#7C3E5A', text: '#fff' },
  educational: { bg: '#4A7C59', text: '#fff' },
  persuasive: { bg: '#9E6B3A', text: '#fff' },
}

export const AUDIENCE_COLORS = {
  sellers: { bg: '#9E6B3A', text: '#fff' },
  investors: { bg: '#2B6CB0', text: '#fff' },
  academic: { bg: '#7C3E5A', text: '#fff' },
  general: { bg: '#6B6560', text: '#fff' },
  professional: { bg: '#4A7C59', text: '#fff' },
}

export const SIGNATURE_MOVE_COLORS = {
  rhetorical_question: { bg: '#3D5A80', text: '#fff' },
  perhaps_emphasis: { bg: '#7C3E5A', text: '#fff' },
  define_before_build: { bg: '#4A7C59', text: '#fff' },
  i_believe: { bg: '#9E6B3A', text: '#fff' },
  systemic_connector: { bg: '#2B6CB0', text: '#fff' },
}

export const QUALITY_COLORS = {
  strong: { bg: '#4A7C59', text: '#fff' },
  usable: { bg: '#9E6B3A', text: '#fff' },
  weak: { bg: '#7C4A4A', text: '#fff' },
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
