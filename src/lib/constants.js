/** Color mappings for tags and badges throughout the app */

export const STATUS_COLORS = {
  draft: { bg: '#9E6B3A', text: '#fff' },
  review: { bg: '#3D7AED', text: '#fff' },
  approved: { bg: '#2EAD6A', text: '#fff' },
  published: { bg: '#6C5CE7', text: '#fff' },
  archived: { bg: '#7B8098', text: '#fff' },
}

export const TONE_COLORS = {
  analytical: { bg: '#3D7AED', text: '#fff' },
  empathetic: { bg: '#D63384', text: '#fff' },
  educational: { bg: '#2EAD6A', text: '#fff' },
  persuasive: { bg: '#E8872B', text: '#fff' },
}

export const AUDIENCE_COLORS = {
  sellers: { bg: '#E8872B', text: '#fff' },
  investors: { bg: '#3D7AED', text: '#fff' },
  academic: { bg: '#D63384', text: '#fff' },
  general: { bg: '#7B8098', text: '#fff' },
  professional: { bg: '#2EAD6A', text: '#fff' },
}

export const SIGNATURE_MOVE_COLORS = {
  rhetorical_question: { bg: '#3D7AED', text: '#fff' },
  perhaps_emphasis: { bg: '#D63384', text: '#fff' },
  define_before_build: { bg: '#2EAD6A', text: '#fff' },
  i_believe: { bg: '#E8872B', text: '#fff' },
  systemic_connector: { bg: '#6C5CE7', text: '#fff' },
}

export const QUALITY_COLORS = {
  strong: { bg: '#2EAD6A', text: '#fff' },
  usable: { bg: '#E8872B', text: '#fff' },
  weak: { bg: '#E04B5A', text: '#fff' },
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
