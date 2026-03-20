/**
 * Word-level diff engine for the Content Lab.
 * Compares original text against edited text and produces
 * a list of diff operations: equal, insert, delete.
 *
 * Uses a simple LCS (Longest Common Subsequence) approach
 * optimized for word-level comparison.
 */

/**
 * Tokenize text into words and whitespace, preserving structure.
 * Each token is { text, isWord }.
 * @param {string} text
 * @returns {{ text: string, isWord: boolean }[]}
 */
function tokenize(text) {
  const tokens = []
  const regex = /(\S+|\s+)/g
  let match
  while ((match = regex.exec(text)) !== null) {
    tokens.push({ text: match[1], isWord: /\S/.test(match[1]) })
  }
  return tokens
}

/**
 * Compute word-level diff between original and edited text.
 * Returns an array of { type: 'equal'|'insert'|'delete', text: string }.
 * @param {string} original
 * @param {string} edited
 * @returns {{ type: string, text: string }[]}
 */
export function computeDiff(original, edited) {
  const origWords = tokenize(original).filter(t => t.isWord).map(t => t.text)
  const editWords = tokenize(edited).filter(t => t.isWord).map(t => t.text)

  // LCS table
  const m = origWords.length
  const n = editWords.length

  // For very long texts, use a simplified greedy approach
  if (m + n > 10000) {
    return simpleDiff(origWords, editWords)
  }

  // Build LCS lengths table
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

  // Backtrack to build diff
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

  // Merge consecutive same-type operations
  return mergeOps(ops)
}

/**
 * Simplified diff for very long texts — uses line-level comparison first.
 */
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
  while (oi < origWords.length) {
    ops.push({ type: 'delete', text: origWords[oi++] })
  }
  while (ei < editWords.length) {
    ops.push({ type: 'insert', text: editWords[ei++] })
  }
  return mergeOps(ops)
}

function mergeOps(ops) {
  if (ops.length === 0) return ops
  const merged = [ops[0]]
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
