/**
 * Client-side readability analysis engine.
 * Computes Flesch-Kincaid Grade Level, Reading Ease, contraction rate,
 * average sentence length, and complex word percentage.
 */

/** Common contractions mapped to their uncontracted forms */
const CONTRACTION_MAP = {
  "don't": "do not", "doesn't": "does not", "didn't": "did not",
  "won't": "will not", "wouldn't": "would not", "couldn't": "could not",
  "shouldn't": "shouldn't", "isn't": "is not", "aren't": "are not",
  "wasn't": "was not", "weren't": "were not", "hasn't": "has not",
  "haven't": "have not", "hadn't": "had not", "can't": "cannot",
  "mustn't": "must not", "shan't": "shall not", "needn't": "need not",
  "it's": "it is", "that's": "that is", "there's": "there is",
  "here's": "here is", "he's": "he is", "she's": "she is",
  "what's": "what is", "who's": "who is", "where's": "where is",
  "how's": "how is", "let's": "let us", "i'm": "i am",
  "you're": "you are", "we're": "we are", "they're": "they are",
  "i've": "i have", "you've": "you have", "we've": "we have",
  "they've": "they have", "i'll": "i will", "you'll": "you will",
  "he'll": "he will", "she'll": "she will", "we'll": "we will",
  "they'll": "they will", "i'd": "i would", "you'd": "you would",
  "he'd": "he would", "she'd": "she would", "we'd": "we would",
  "they'd": "they would",
}

/** Uncontracted phrases to look for */
const UNCONTRACTED_PHRASES = [
  "do not", "does not", "did not", "will not", "would not",
  "could not", "should not", "is not", "are not", "was not",
  "were not", "has not", "have not", "had not", "cannot",
  "must not", "shall not", "need not", "it is", "that is",
  "there is", "here is", "he is", "she is", "what is",
  "who is", "where is", "how is", "let us", "i am",
  "you are", "we are", "they are", "i have", "you have",
  "we have", "they have", "i will", "you will", "he will",
  "she will", "we will", "they will", "i would", "you would",
  "he would", "she would", "we would", "they would",
]

/**
 * Count syllables in a word using the vowel-cluster method.
 * @param {string} word
 * @returns {number}
 */
export function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '')
  if (word.length <= 2) return 1

  // Count vowel clusters
  const vowelClusters = word.match(/[aeiouy]+/g)
  let count = vowelClusters ? vowelClusters.length : 1

  // Subtract silent e at end
  if (word.endsWith('e') && !word.endsWith('le') && count > 1) {
    count--
  }

  // Common suffixes that add syllables
  if (word.endsWith('tion') || word.endsWith('sion')) {
    // already counted
  }

  return Math.max(1, count)
}

/**
 * Split text into sentences (handles abbreviations reasonably).
 * @param {string} text
 * @returns {string[]}
 */
function splitSentences(text) {
  if (!text.trim()) return []
  // Split on sentence-ending punctuation followed by space or end
  const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0)
  return sentences.length ? sentences : [text]
}

/**
 * Extract words from text (strips markdown syntax).
 * @param {string} text
 * @returns {string[]}
 */
function extractWords(text) {
  // Strip markdown syntax
  const plain = text
    .replace(/#{1,6}\s/g, '')           // headings
    .replace(/\*{1,3}(.*?)\*{1,3}/g, '$1') // bold/italic
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links
    .replace(/`{1,3}[^`]*`{1,3}/g, '')  // code
    .replace(/>\s/g, '')                 // blockquotes
    .replace(/[-*+]\s/g, '')            // list markers
    .replace(/\d+\.\s/g, '')            // numbered lists

  return plain.match(/[a-zA-Z']+/g) || []
}

/**
 * Compute contraction rate: contracted / (contracted + uncontracted) * 100
 * @param {string} text
 * @returns {{ rate: number, contracted: number, uncontracted: number }}
 */
export function computeContractionRate(text) {
  const lower = text.toLowerCase()

  let contracted = 0
  for (const contraction of Object.keys(CONTRACTION_MAP)) {
    const regex = new RegExp(`\\b${contraction.replace("'", "'")}\\b`, 'gi')
    const matches = lower.match(regex)
    if (matches) contracted += matches.length
  }

  let uncontracted = 0
  for (const phrase of UNCONTRACTED_PHRASES) {
    const regex = new RegExp(`\\b${phrase}\\b`, 'gi')
    const matches = lower.match(regex)
    if (matches) uncontracted += matches.length
  }

  const total = contracted + uncontracted
  const rate = total > 0 ? (contracted / total) * 100 : 0

  return { rate: Math.round(rate * 10) / 10, contracted, uncontracted }
}

/**
 * Full readability analysis of a markdown text.
 * @param {string} markdown
 * @returns {{
 *   wordCount: number,
 *   sentenceCount: number,
 *   avgSentenceLength: number,
 *   syllableCount: number,
 *   complexWordPct: number,
 *   fkGrade: number,
 *   readingEase: number,
 *   contractionRate: number,
 * }}
 */
export function analyzeReadability(markdown) {
  if (!markdown || !markdown.trim()) {
    return {
      wordCount: 0, sentenceCount: 0, avgSentenceLength: 0,
      syllableCount: 0, complexWordPct: 0, fkGrade: 0,
      readingEase: 0, contractionRate: 0,
    }
  }

  const words = extractWords(markdown)
  const sentences = splitSentences(markdown.replace(/#{1,6}\s/g, '').replace(/[-*+]\s/g, ''))
  const wordCount = words.length
  const sentenceCount = Math.max(sentences.length, 1)

  let syllableCount = 0
  let complexWords = 0
  for (const word of words) {
    const s = countSyllables(word)
    syllableCount += s
    if (s >= 3) complexWords++
  }

  const avgSentenceLength = wordCount / sentenceCount
  const avgSyllablesPerWord = wordCount > 0 ? syllableCount / wordCount : 0
  const complexWordPct = wordCount > 0 ? (complexWords / wordCount) * 100 : 0

  // FK Grade = 0.39 × (words/sentences) + 11.8 × (syllables/words) − 15.59
  const fkGrade = 0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59

  // Reading Ease = 206.835 − 1.015 × (words/sentences) − 84.6 × (syllables/words)
  const readingEase = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord

  const { rate: contractionRate } = computeContractionRate(markdown)

  return {
    wordCount,
    sentenceCount,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    syllableCount,
    complexWordPct: Math.round(complexWordPct * 10) / 10,
    fkGrade: Math.round(fkGrade * 10) / 10,
    readingEase: Math.round(readingEase * 10) / 10,
    contractionRate,
  }
}
