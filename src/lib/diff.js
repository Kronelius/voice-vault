/**
 * Word-level diff engine for the Content Lab.
 * Compares original text against edited text and produces
 * a list of diff operations: equal, insert, delete.
 */

/**
 * Compute word-level diff between two strings.
 * Returns an array of { type: 'equal'|'insert'|'delete', text: string }.
 * @param {string} original
 * @param {string} edited
 * @returns {{ type: string, text: string }[]}
 */
export function computeDiff(original, edited) {
  const origWords = splitWords(original)
  const editWords = splitWords(edited)

  if (origWords.length + editWords.length > 10000) {
    return simpleDiff(origWords, editWords)
  }

  const m = origWords.length
  const n = editWords.length
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (origWords[i - 1] === editWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  const ops = []
  let i = m, j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origWords[i - 1] === editWords[j - 1]) {
      ops.unshift({ type: 'equal', text: origWords[i - 1] })
      i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.unshift({ type: 'insert', text: editWords[j - 1] })
      j--
    } else {
      ops.unshift({ type: 'delete', text: origWords[i - 1] })
      i--
    }
  }

  return mergeOps(ops)
}

/**
 * Compute a line-by-line diff, then word-diff within each changed line.
 * Returns markdown string with inline HTML spans for diff highlighting.
 * @param {string} original
 * @param {string} edited
 * @returns {string} Markdown with embedded diff HTML
 */
export function computeDiffMarkdown(original, edited) {
  const origLines = original.split('\n')
  const editLines = edited.split('\n')

  // LCS on lines
  const m = origLines.length
  const n = editLines.length
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (origLines[i - 1] === editLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  // Backtrack to get line-level ops
  const lineOps = []
  let li = m, lj = n
  while (li > 0 || lj > 0) {
    if (li > 0 && lj > 0 && origLines[li - 1] === editLines[lj - 1]) {
      lineOps.unshift({ type: 'equal', orig: origLines[li - 1], edit: editLines[lj - 1] })
      li--; lj--
    } else if (lj > 0 && (li === 0 || dp[li][lj - 1] >= dp[li - 1][lj])) {
      lineOps.unshift({ type: 'insert', edit: editLines[lj - 1] })
      lj--
    } else {
      lineOps.unshift({ type: 'delete', orig: origLines[li - 1] })
      li--
    }
  }

  // Try to pair adjacent delete+insert as modifications for word-level diff
  const result = []
  let idx = 0
  while (idx < lineOps.length) {
    const op = lineOps[idx]

    if (op.type === 'equal') {
      result.push(op.edit)
      idx++
    } else if (op.type === 'delete' && idx + 1 < lineOps.length && lineOps[idx + 1].type === 'insert') {
      // Paired modification — do word-level diff within this line
      const wordOps = computeDiff(op.orig, lineOps[idx + 1].edit)
      result.push(opsToMarkdownLine(wordOps, lineOps[idx + 1].edit))
      idx += 2
    } else if (op.type === 'delete') {
      // Entire line deleted
      const escaped = escapeHtml(op.orig)
      // Preserve heading markers but wrap content
      const headingMatch = op.orig.match(/^(#{1,6}\s)(.*)$/)
      if (headingMatch) {
        result.push(`${headingMatch[1]}<span style="color:#E04B5A;text-decoration:line-through;font-weight:bold">${escapeHtml(headingMatch[2])}</span>`)
      } else {
        result.push(`<span style="color:#E04B5A;text-decoration:line-through;font-weight:bold">${escaped}</span>`)
      }
      idx++
    } else if (op.type === 'insert') {
      // Entire line inserted
      const escaped = escapeHtml(op.edit)
      const headingMatch = op.edit.match(/^(#{1,6}\s)(.*)$/)
      if (headingMatch) {
        result.push(`${headingMatch[1]}<span style="color:#E04B5A;font-weight:bold">${escapeHtml(headingMatch[2])}</span>`)
      } else {
        result.push(`<span style="color:#E04B5A;font-weight:bold">${escaped}</span>`)
      }
      idx++
    } else {
      idx++
    }
  }

  return result.join('\n')
}

/**
 * Convert word-level diff ops into a markdown-safe line with inline HTML spans.
 * Preserves leading markdown syntax (like # headers).
 */
function opsToMarkdownLine(ops, editLine) {
  // Detect if line starts with markdown heading
  const headingMatch = editLine.match(/^(#{1,6}\s)/)
  const prefix = headingMatch ? headingMatch[1] : ''

  const parts = []
  let skipPrefix = !!prefix

  for (const op of ops) {
    let text = op.text

    // Skip the heading marker characters from diff output
    if (skipPrefix && op.type === 'equal' && prefix) {
      const trimmed = text.replace(/^#{1,6}\s?/, '')
      if (trimmed !== text) {
        text = trimmed
        skipPrefix = false
        if (!text) continue
      }
    }

    const escaped = escapeHtml(text)

    if (op.type === 'equal') {
      parts.push(escaped)
    } else if (op.type === 'delete') {
      parts.push(`<span style="color:#E04B5A;text-decoration:line-through;font-weight:bold">${escaped}</span>`)
    } else if (op.type === 'insert') {
      parts.push(`<span style="color:#E04B5A;font-weight:bold">${escaped}</span>`)
    }
  }

  return prefix + parts.join(' ')
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function splitWords(text) {
  return text.match(/\S+/g) || []
}

function simpleDiff(origWords, editWords) {
  const ops = []
  const origSet = new Set(origWords)
  const editSet = new Set(editWords)
  let oi = 0, ei = 0
  while (oi < origWords.length && ei < editWords.length) {
    if (origWords[oi] === editWords[ei]) {
      ops.push({ type: 'equal', text: origWords[oi] })
      oi++; ei++
    } else if (!editSet.has(origWords[oi])) {
      ops.push({ type: 'delete', text: origWords[oi] })
      oi++
    } else if (!origSet.has(editWords[ei])) {
      ops.push({ type: 'insert', text: editWords[ei] })
      ei++
    } else {
      ops.push({ type: 'delete', text: origWords[oi] })
      oi++
    }
  }
  while (oi < origWords.length) ops.push({ type: 'delete', text: origWords[oi++] })
  while (ei < editWords.length) ops.push({ type: 'insert', text: editWords[ei++] })
  return mergeOps(ops)
}

function mergeOps(ops) {
  if (ops.length === 0) return ops
  const merged = [{ ...ops[0] }]
  for (let i = 1; i < ops.length; i++) {
    const last = merged[merged.length - 1]
    if (ops[i].type === last.type) {
      last.text += ' ' + ops[i].text
    } else {
      merged.push({ ...ops[i] })
    }
  }
  return merged
}
