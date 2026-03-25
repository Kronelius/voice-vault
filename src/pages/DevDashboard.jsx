import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

/* ───────────────────────────────────────────
   Project Phases & Tasks — Single Source of Truth
   ─────────────────────────────────────────── */
const PROJECT_PHASES = [
  {
    id: 'phase-1',
    name: 'Phase 1 — Voice Vault Foundation',
    description: 'Core CMS, voice profiling, and design system',
    status: 'complete',
    tasks: [
      { id: '1.01', label: 'Supabase schema design (voice_chunks, writing_samples, generated_content, voice_profiles, seo_metadata)', status: 'done' },
      { id: '1.02', label: 'Content CRUD — list, create, edit, delete with status workflow', status: 'done' },
      { id: '1.03', label: 'Markdown editor with live split preview (@uiw/react-md-editor)', status: 'done' },
      { id: '1.04', label: 'Real-time readability metrics — FK Grade, Reading Ease, Avg Sentence Length, Complex Word %, Contraction Rate', status: 'done' },
      { id: '1.05', label: 'Content Lab — sandbox editing with word-level LCS diff engine', status: 'done' },
      { id: '1.06', label: 'Content Lab — synced scrolling, side-by-side metrics comparison with deltas', status: 'done' },
      { id: '1.07', label: 'Content Lab — status workflow (editing → pending_review → analyzed → commit)', status: 'done' },
      { id: '1.08', label: 'Voice Chunks browser with multi-filter (audience, tone, quality, signature moves) + full-text search', status: 'done' },
      { id: '1.09', label: 'Voice Chunks inline editor — edit excerpt, full_text, tags, notes', status: 'done' },
      { id: '1.10', label: 'Writing Samples management — master-detail layout with metadata editing', status: 'done' },
      { id: '1.11', label: 'Voice Profile editor — summary, system prompt, signature moves, vocabulary, tone spectrum, reading level targets, audience adaptation', status: 'done' },
      { id: '1.12', label: 'Analog Warmth design system — sketch-card borders, paper texture, custom cursors, pastel note colors', status: 'done' },
      { id: '1.13', label: 'Mobile responsive layout — hamburger sidebar, stacked layouts, touch cursor disable', status: 'done' },
      { id: '1.14', label: 'Dark mode with full CSS custom property system + localStorage persistence', status: 'done' },
      { id: '1.15', label: 'Password gate — iPhone-style 4-digit PIN with numpad UI', status: 'done' },
      { id: '1.16', label: 'SEO metadata panel in editor — title tag, meta description, primary keyword, strengths/improvements', status: 'done' },
    ]
  },
  {
    id: 'phase-2',
    name: 'Phase 2 — AI Integration',
    description: 'Claude-powered editing, review, and chat assistant',
    status: 'complete',
    tasks: [
      { id: '2.01', label: 'Vercel serverless API layer — shared Anthropic client, Supabase key lookup with env fallback', status: 'done' },
      { id: '2.02', label: 'Content Review endpoint — Claude analyzes lab edits against voice profile, returns structured notes', status: 'done' },
      { id: '2.03', label: 'Adjust Grade endpoint — streaming rewrite targeting specific FK Grade Level with formula-aware prompting', status: 'done' },
      { id: '2.04', label: 'Suggest Headlines endpoint — generates headline variants from draft content', status: 'done' },
      { id: '2.05', label: 'Strengthen Opening endpoint — rewrites article intros for impact', status: 'done' },
      { id: '2.06', label: 'Floating Chat Panel — slide-up 420×580px panel accessible from any page', status: 'done' },
      { id: '2.07', label: 'Chat context awareness — detects current content from URL, injects draft into Claude context', status: 'done' },
      { id: '2.08', label: 'Quick Actions bar — Request Review, Suggest Headlines, Strengthen Opening, Adjust Grade', status: 'done' },
      { id: '2.09', label: '"Apply to Lab" — chat rewrites write directly to lab_markdown in Supabase', status: 'done' },
      { id: '2.10', label: 'Real-time Lab refresh — Supabase channel subscription for cross-panel updates', status: 'done' },
      { id: '2.11', label: 'Auto voice chunk extraction — fire-and-forget on lab commit, identifies 0–5 patterns', status: 'done' },
      { id: '2.12', label: 'API cost tracker — sidebar widget showing last run, today, 7-day totals from ai_usage_log', status: 'done' },
      { id: '2.13', label: 'Settings page — manage API keys in Supabase without redeployment', status: 'done' },
      { id: '2.14', label: 'Content generation from scratch — brief → voice profile → full draft pipeline' },
      { id: '2.15', label: 'Multi-model support — GPT-4o / Claude model selection per task' },
    ]
  },
  {
    id: 'phase-3',
    name: 'Phase 3 — Website Scraping & Site Audit',
    description: 'Crawl target websites, extract structure, map internal links, identify technical SEO issues',
    status: 'upcoming',
    tasks: [
      { id: '3.01', label: 'Website crawler engine — handle JS-rendered sites (Playwright/Puppeteer) + static HTML' },
      { id: '3.02', label: 'Page data extraction — URL, canonical, title, meta description, H1-H6 hierarchy, word count, reading level' },
      { id: '3.03', label: 'Internal link graph mapping — adjacency list in Supabase for link equity analysis' },
      { id: '3.04', label: 'External link extraction — outbound links with anchor text' },
      { id: '3.05', label: 'Image audit — alt text presence/absence, file sizes' },
      { id: '3.06', label: 'Schema/structured data detection — JSON-LD, microdata extraction per page' },
      { id: '3.07', label: 'Technical SEO audit — missing meta, duplicate titles, broken links, redirect chains, orphan pages' },
      { id: '3.08', label: 'Site structure visualization — tree/graph view of URL hierarchy and link flow' },
      { id: '3.09', label: 'Crawl scheduling — on-demand + recurring crawls with diff detection' },
      { id: '3.10', label: 'Crawl history — store snapshots, track changes over time' },
      { id: '3.11', label: 'Supabase tables: sites, pages, links, crawl_runs, page_issues' },
    ]
  },
  {
    id: 'phase-4',
    name: 'Phase 4 — Keyword Intelligence',
    description: 'API integrations for keyword research, SERP analysis, and content gap identification',
    status: 'upcoming',
    tasks: [
      { id: '4.01', label: 'DataForSEO API integration — keyword search volume, difficulty, CPC, trends' },
      { id: '4.02', label: 'DataForSEO — related keywords and keyword suggestions endpoints' },
      { id: '4.03', label: 'Serper.dev integration — real-time SERP scraping (top results, SERP features, PAA)' },
      { id: '4.04', label: 'Google Search Console OAuth flow — site verification and permission grant' },
      { id: '4.05', label: 'GSC data import — queries, impressions, clicks, CTR, avg position (16mo history)' },
      { id: '4.06', label: 'Competitor identification — auto-detect top 3–5 organic competitors for a domain' },
      { id: '4.07', label: 'Competitor keyword extraction — pull all keywords competitors rank for (positions 1–20)' },
      { id: '4.08', label: 'Content gap analysis — missing keywords (competitors rank, you don\'t), weak keywords (you rank 11–50), declining keywords' },
      { id: '4.09', label: 'Opportunity scoring algorithm — (Volume × CTR_estimate) / Difficulty, weighted by commercial intent + SERP features + cluster fit' },
      { id: '4.10', label: 'Keyword clustering — semantic grouping via embeddings (OpenAI text-embedding-3-small or DataForSEO grouping endpoint)' },
      { id: '4.11', label: 'API response caching layer — 30-day cache for volumes/difficulty, 7-day for SERP results' },
      { id: '4.12', label: 'Supabase tables: keywords, keyword_clusters, serp_snapshots, competitors, content_gaps' },
    ]
  },
  {
    id: 'phase-5',
    name: 'Phase 5 — Content Strategy & Planning',
    description: 'Map keywords to content types, build topic clusters, generate content briefs',
    status: 'upcoming',
    tasks: [
      { id: '5.01', label: 'Search intent classifier — informational, navigational, commercial investigation, transactional (rule-based + LLM hybrid)' },
      { id: '5.02', label: 'SERP-based intent validation — analyze what Google actually ranks to confirm intent classification' },
      { id: '5.03', label: 'Keyword → content type mapper — blog post, landing page, pillar content, FAQ, comparison page' },
      { id: '5.04', label: 'Difficulty-based prioritization — KD tiers (easy/medium/hard/extreme) with strategy recommendations per tier' },
      { id: '5.05', label: 'Hub-and-spoke topic cluster builder — pillar pages + 5–15 supporting cluster articles per topic' },
      { id: '5.06', label: 'Topic cluster visualization — interactive graph showing pillar → cluster relationships' },
      { id: '5.07', label: 'Content brief generator — target keyword, secondary keywords, word count, heading structure, required entities, internal links' },
      { id: '5.08', label: 'Editorial calendar — content queue with status, assignee, target publish date, priority' },
      { id: '5.09', label: 'Internal linking recommendations — suggest which existing pages to link from/to for each new piece' },
      { id: '5.10', label: 'Supabase tables: content_briefs, topic_clusters, editorial_calendar' },
    ]
  },
  {
    id: 'phase-6',
    name: 'Phase 6 — SEO-Optimized Content Generation',
    description: 'Generate voice-matched, keyword-targeted content with automated SEO scoring',
    status: 'upcoming',
    tasks: [
      { id: '6.01', label: 'Content brief → voice-matched draft pipeline — structured generation with brief + voice profile context' },
      { id: '6.02', label: 'Section-by-section generation — generate in parts for better quality control vs monolithic' },
      { id: '6.03', label: 'Natural keyword placement — primary keyword in title, first 100 words, one H2, meta; secondary keywords distributed' },
      { id: '6.04', label: 'Topical completeness engine — extract required entities/subtopics from top-ranking competitor content' },
      { id: '6.05', label: 'SEO scoring engine — weighted 0–100 score (title 15pts, meta 10pts, headings 15pts, content 25pts, links 15pts, technical 10pts, media 10pts)' },
      { id: '6.06', label: 'SEO optimization suggestions — actionable recommendations to improve score' },
      { id: '6.07', label: 'Schema markup generator — auto-generate JSON-LD (Article, FAQ, HowTo) based on content type' },
      { id: '6.08', label: 'Meta title/description generator — multiple variants for A/B testing' },
      { id: '6.09', label: 'Internal link suggestion engine — recommend anchor text + destination from existing site pages' },
      { id: '6.10', label: 'Image alt text recommendations — suggest alt text based on surrounding content context' },
    ]
  },
  {
    id: 'phase-7',
    name: 'Phase 7 — Publishing & Performance',
    description: 'Close the loop with analytics, rank tracking, and content decay detection',
    status: 'upcoming',
    tasks: [
      { id: '7.01', label: 'Google Analytics Data API (GA4) integration — sessions, bounce rate, time on page, conversions per article' },
      { id: '7.02', label: 'Rank tracking — weekly keyword position checks via DataForSEO or SerpAPI' },
      { id: '7.03', label: 'Content performance dashboard — per-article metrics (ranking, traffic, impressions, CTR, engagement)' },
      { id: '7.04', label: 'Content decay detection — alert when page drops >5 positions or traffic drops >20% MoM' },
      { id: '7.05', label: 'Content refresh recommendations — flag stale articles with specific improvement suggestions' },
      { id: '7.06', label: 'ROI reporting — estimated traffic value (organic visits × equivalent CPC) vs production cost' },
      { id: '7.07', label: 'Content velocity metrics — articles/week, time from brief to published, % reaching page 1 within 90 days' },
      { id: '7.08', label: 'WordPress/CMS publishing integration — one-click export with SEO metadata, schema markup, images' },
      { id: '7.09', label: 'Supabase tables: rank_tracking, performance_snapshots, content_alerts' },
    ]
  },
  {
    id: 'phase-8',
    name: 'Phase 8 — Platform & Scale',
    description: 'Authentication, multi-user, version history, and SaaS-ready infrastructure',
    status: 'upcoming',
    tasks: [
      { id: '8.01', label: 'Supabase Auth — proper email/password authentication replacing PIN gate' },
      { id: '8.02', label: 'Row-Level Security policies on all tables — per-user/team data isolation' },
      { id: '8.03', label: 'Multi-user/team support — invite dev partners, assign roles (admin, editor, viewer)' },
      { id: '8.04', label: 'Version history with diff viewer — browse past revisions of any content piece' },
      { id: '8.05', label: 'API usage tracking per user — billing/limits for third-party API consumption' },
      { id: '8.06', label: 'Onboarding flow — guided setup for new sites (add domain, connect GSC, first crawl)' },
      { id: '8.07', label: 'Multi-site support — manage multiple domains from one dashboard' },
      { id: '8.08', label: 'Async job queue — background processing for crawls, keyword research batches, content generation' },
      { id: '8.09', label: 'Notification system — email/in-app alerts for content decay, rank changes, task assignments' },
      { id: '8.10', label: 'Custom domain + branding — white-label capability' },
    ]
  },
]

/* ───────────────────────────────────────────
   Dev Dashboard Component
   ─────────────────────────────────────────── */
export default function DevDashboard() {
  const navigate = useNavigate()
  const [authenticated, setAuthenticated] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [completedTasks, setCompletedTasks] = useState({})
  const [taskNotes, setTaskNotes] = useState({})
  const [editingNote, setEditingNote] = useState(null)
  const [noteValue, setNoteValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activePhase, setActivePhase] = useState('phase-1')
  const [lastUpdated, setLastUpdated] = useState(null)

  const DEV_PIN = '1234'

  // Check session
  useEffect(() => {
    if (sessionStorage.getItem('dev_auth') === 'true') {
      setAuthenticated(true)
    }
  }, [])

  // Load task states from Supabase
  useEffect(() => {
    if (!authenticated) return
    loadTasks()
  }, [authenticated])

  async function loadTasks() {
    setLoading(true)
    const { data } = await supabase
      .from('project_tasks')
      .select('task_id, completed, completed_by, completed_at, notes, updated_at')

    const completed = {}
    const notes = {}
    let latest = null

    ;(data || []).forEach(row => {
      if (row.completed) completed[row.task_id] = { by: row.completed_by, at: row.completed_at }
      if (row.notes) notes[row.task_id] = row.notes
      if (!latest || new Date(row.updated_at) > new Date(latest)) latest = row.updated_at
    })

    setCompletedTasks(completed)
    setTaskNotes(notes)
    setLastUpdated(latest)
    setLoading(false)
  }

  async function toggleTask(taskId) {
    const isCompleted = !!completedTasks[taskId]
    setSaving(true)

    if (isCompleted) {
      // Uncomplete
      await supabase.from('project_tasks').upsert({
        task_id: taskId,
        completed: false,
        completed_by: null,
        completed_at: null,
        updated_at: new Date().toISOString(),
      })
      setCompletedTasks(prev => {
        const next = { ...prev }
        delete next[taskId]
        return next
      })
    } else {
      // Complete
      const now = new Date().toISOString()
      await supabase.from('project_tasks').upsert({
        task_id: taskId,
        completed: true,
        completed_by: 'dev',
        completed_at: now,
        updated_at: now,
      })
      setCompletedTasks(prev => ({ ...prev, [taskId]: { by: 'dev', at: now } }))
    }
    setSaving(false)
  }

  async function saveNote(taskId) {
    setSaving(true)
    await supabase.from('project_tasks').upsert({
      task_id: taskId,
      notes: noteValue || null,
      updated_at: new Date().toISOString(),
    })
    setTaskNotes(prev => noteValue ? { ...prev, [taskId]: noteValue } : (() => { const n = { ...prev }; delete n[taskId]; return n })())
    setEditingNote(null)
    setNoteValue('')
    setSaving(false)
  }

  const handlePinSubmit = useCallback(() => {
    if (pin === DEV_PIN) {
      sessionStorage.setItem('dev_auth', 'true')
      setAuthenticated(true)
      setPinError(false)
    } else {
      setPinError(true)
      setPin('')
    }
  }, [pin])

  // Compute stats
  const allTasks = PROJECT_PHASES.flatMap(p => p.tasks)
  const totalTasks = allTasks.length
  const preCompleted = allTasks.filter(t => t.status === 'done').length
  const dynamicCompleted = Object.keys(completedTasks).length
  const totalCompleted = preCompleted + dynamicCompleted
  const overallProgress = Math.round((totalCompleted / totalTasks) * 100)

  function getPhaseStats(phase) {
    const total = phase.tasks.length
    const done = phase.tasks.filter(t => t.status === 'done' || completedTasks[t.id]).length
    return { total, done, pct: Math.round((done / total) * 100) }
  }

  /* ─── Login Gate ─── */
  if (!authenticated) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <div style={styles.loginIcon}>🔧</div>
          <h1 style={styles.loginTitle}>Dev Dashboard</h1>
          <p style={styles.loginSub}>Enter developer PIN to continue</p>
          <div style={styles.pinRow}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{
                ...styles.pinDot,
                ...(pin.length > i ? styles.pinDotFilled : {}),
                ...(pinError ? styles.pinDotError : {}),
              }} />
            ))}
          </div>
          <div style={styles.numpad}>
            {[1,2,3,4,5,6,7,8,9,null,0,'⌫'].map((key, i) => (
              <button
                key={i}
                style={{
                  ...styles.numKey,
                  ...(key === null ? styles.numKeyEmpty : {}),
                }}
                onClick={() => {
                  if (key === null) return
                  if (key === '⌫') { setPin(p => p.slice(0, -1)); setPinError(false); return }
                  const next = pin + key
                  setPin(next)
                  setPinError(false)
                  if (next.length === 4) {
                    if (next === DEV_PIN) {
                      sessionStorage.setItem('dev_auth', 'true')
                      setAuthenticated(true)
                    } else {
                      setPinError(true)
                      setTimeout(() => setPin(''), 400)
                    }
                  }
                }}
                disabled={key === null}
              >
                {key}
              </button>
            ))}
          </div>
          <button style={styles.backLink} onClick={() => navigate('/')}>
            ← Back to Voice Vault
          </button>
        </div>
      </div>
    )
  }

  /* ─── Main Dashboard ─── */
  const activePhaseData = PROJECT_PHASES.find(p => p.id === activePhase)

  return (
    <div style={styles.container}>
      {/* Top Bar */}
      <header style={styles.topBar}>
        <div style={styles.topLeft}>
          <span style={styles.logo}>⚡</span>
          <div>
            <h1 style={styles.topTitle}>SEO Content Engine</h1>
            <p style={styles.topSub}>Development Status Dashboard</p>
          </div>
        </div>
        <div style={styles.topRight}>
          <div style={styles.overallProgress}>
            <div style={styles.progressLabel}>
              <span>Overall Progress</span>
              <span style={styles.progressPct}>{overallProgress}%</span>
            </div>
            <div style={styles.progressBarOuter}>
              <div style={{ ...styles.progressBarInner, width: `${overallProgress}%` }} />
            </div>
            <span style={styles.progressDetail}>{totalCompleted} / {totalTasks} tasks</span>
          </div>
          <button style={styles.vaultLink} onClick={() => navigate('/')}>
            Voice Vault →
          </button>
        </div>
      </header>

      <div style={styles.body}>
        {/* Phase Sidebar */}
        <nav style={styles.phaseSidebar}>
          <div style={styles.phaseListLabel}>PHASES</div>
          {PROJECT_PHASES.map(phase => {
            const stats = getPhaseStats(phase)
            const isActive = phase.id === activePhase
            return (
              <button
                key={phase.id}
                style={{
                  ...styles.phaseItem,
                  ...(isActive ? styles.phaseItemActive : {}),
                }}
                onClick={() => setActivePhase(phase.id)}
              >
                <div style={styles.phaseItemTop}>
                  <span style={styles.phaseItemName}>{phase.name.split(' — ')[0]}</span>
                  <span style={{
                    ...styles.phaseItemPct,
                    color: stats.pct === 100 ? '#22c55e' : stats.pct > 0 ? '#f59e0b' : '#64748b',
                  }}>{stats.pct}%</span>
                </div>
                <div style={styles.miniBarOuter}>
                  <div style={{
                    ...styles.miniBarInner,
                    width: `${stats.pct}%`,
                    background: stats.pct === 100 ? '#22c55e' : stats.pct > 0 ? '#f59e0b' : '#334155',
                  }} />
                </div>
              </button>
            )
          })}
          {lastUpdated && (
            <div style={styles.lastUpdated}>
              Last update: {new Date(lastUpdated).toLocaleDateString()}
            </div>
          )}
        </nav>

        {/* Task List */}
        <main style={styles.taskArea}>
          {activePhaseData && (
            <>
              <div style={styles.phaseHeader}>
                <h2 style={styles.phaseTitle}>{activePhaseData.name}</h2>
                <p style={styles.phaseDesc}>{activePhaseData.description}</p>
                <div style={styles.phaseStats}>
                  {(() => {
                    const s = getPhaseStats(activePhaseData)
                    return (
                      <>
                        <span style={styles.statBadge}>{s.done} / {s.total} complete</span>
                        <span style={{
                          ...styles.statusBadge,
                          background: s.pct === 100 ? '#dcfce7' : s.pct > 0 ? '#fef3c7' : '#f1f5f9',
                          color: s.pct === 100 ? '#166534' : s.pct > 0 ? '#92400e' : '#475569',
                        }}>
                          {s.pct === 100 ? '✓ Complete' : s.pct > 0 ? '◐ In Progress' : '○ Not Started'}
                        </span>
                      </>
                    )
                  })()}
                </div>
              </div>

              <div style={styles.taskList}>
                {activePhaseData.tasks.map(task => {
                  const isDone = task.status === 'done' || !!completedTasks[task.id]
                  const isHardcoded = task.status === 'done'
                  const note = taskNotes[task.id]
                  const isEditingThis = editingNote === task.id

                  return (
                    <div key={task.id} style={{
                      ...styles.taskRow,
                      ...(isDone ? styles.taskRowDone : {}),
                    }}>
                      <div style={styles.taskMain}>
                        <button
                          style={{
                            ...styles.checkbox,
                            ...(isDone ? styles.checkboxDone : {}),
                          }}
                          onClick={() => !isHardcoded && toggleTask(task.id)}
                          disabled={isHardcoded || saving}
                          title={isHardcoded ? 'Completed in shipped code' : isDone ? 'Mark incomplete' : 'Mark complete'}
                        >
                          {isDone && <span style={styles.checkmark}>✓</span>}
                        </button>
                        <div style={styles.taskContent}>
                          <span style={styles.taskId}>{task.id}</span>
                          <span style={{
                            ...styles.taskLabel,
                            ...(isDone ? styles.taskLabelDone : {}),
                          }}>{task.label}</span>
                        </div>
                        <button
                          style={styles.noteToggle}
                          onClick={() => {
                            if (isEditingThis) {
                              setEditingNote(null)
                            } else {
                              setEditingNote(task.id)
                              setNoteValue(note || '')
                            }
                          }}
                          title="Add note"
                        >
                          {note ? '📝' : '＋'}
                        </button>
                      </div>
                      {note && !isEditingThis && (
                        <div style={styles.noteDisplay}>{note}</div>
                      )}
                      {isEditingThis && (
                        <div style={styles.noteEditor}>
                          <input
                            style={styles.noteInput}
                            value={noteValue}
                            onChange={e => setNoteValue(e.target.value)}
                            placeholder="Add a note..."
                            autoFocus
                            onKeyDown={e => e.key === 'Enter' && saveNote(task.id)}
                          />
                          <button style={styles.noteSave} onClick={() => saveNote(task.id)} disabled={saving}>Save</button>
                          <button style={styles.noteCancel} onClick={() => setEditingNote(null)}>Cancel</button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

/* ───────────────────────────────────────────
   Styles — Professional/Clean (not Analog Warmth)
   ─────────────────────────────────────────── */
const styles = {
  // Login
  loginContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0f172a',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  loginCard: {
    background: '#1e293b',
    borderRadius: '16px',
    padding: '48px 40px',
    textAlign: 'center',
    boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
    minWidth: '320px',
  },
  loginIcon: { fontSize: '48px', marginBottom: '16px' },
  loginTitle: { color: '#f1f5f9', fontSize: '24px', fontWeight: 700, margin: '0 0 8px' },
  loginSub: { color: '#94a3b8', fontSize: '14px', margin: '0 0 32px' },
  pinRow: { display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '32px' },
  pinDot: {
    width: '16px', height: '16px', borderRadius: '50%',
    border: '2px solid #475569', background: 'transparent',
    transition: 'all 0.15s',
  },
  pinDotFilled: { background: '#3b82f6', borderColor: '#3b82f6' },
  pinDotError: { background: '#ef4444', borderColor: '#ef4444' },
  numpad: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 64px)',
    gap: '8px', justifyContent: 'center', marginBottom: '24px',
  },
  numKey: {
    width: '64px', height: '52px', borderRadius: '10px',
    border: '1px solid #334155', background: '#0f172a',
    color: '#e2e8f0', fontSize: '20px', fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.1s',
  },
  numKeyEmpty: { visibility: 'hidden' },
  backLink: {
    background: 'none', border: 'none', color: '#64748b',
    fontSize: '13px', cursor: 'pointer', marginTop: '8px',
  },

  // Main layout
  container: {
    minHeight: '100vh',
    background: '#0f172a',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#e2e8f0',
  },
  topBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 32px',
    borderBottom: '1px solid #1e293b',
    background: '#0f172a',
    position: 'sticky', top: 0, zIndex: 10,
  },
  topLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  logo: { fontSize: '28px' },
  topTitle: { fontSize: '18px', fontWeight: 700, margin: 0, color: '#f1f5f9' },
  topSub: { fontSize: '12px', color: '#64748b', margin: 0 },
  topRight: { display: 'flex', alignItems: 'center', gap: '24px' },
  overallProgress: { minWidth: '240px' },
  progressLabel: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' },
  progressPct: { fontWeight: 700, color: '#3b82f6' },
  progressBarOuter: { height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' },
  progressBarInner: { height: '100%', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', borderRadius: '3px', transition: 'width 0.5s ease' },
  progressDetail: { fontSize: '11px', color: '#64748b' },
  vaultLink: {
    background: 'none', border: '1px solid #334155', borderRadius: '8px',
    padding: '8px 16px', color: '#94a3b8', fontSize: '13px',
    cursor: 'pointer', whiteSpace: 'nowrap',
  },

  // Body
  body: { display: 'flex', minHeight: 'calc(100vh - 65px)' },

  // Phase sidebar
  phaseSidebar: {
    width: '260px', minWidth: '260px',
    borderRight: '1px solid #1e293b',
    padding: '16px 12px',
    background: '#0f172a',
    overflowY: 'auto',
  },
  phaseListLabel: {
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em',
    color: '#475569', padding: '0 8px 12px', textTransform: 'uppercase',
  },
  phaseItem: {
    display: 'block', width: '100%', textAlign: 'left',
    padding: '10px 12px', marginBottom: '4px',
    background: 'transparent', border: '1px solid transparent',
    borderRadius: '8px', cursor: 'pointer',
    transition: 'all 0.15s',
    color: '#cbd5e1',
  },
  phaseItemActive: {
    background: '#1e293b',
    border: '1px solid #334155',
  },
  phaseItemTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  phaseItemName: { fontSize: '13px', fontWeight: 600 },
  phaseItemPct: { fontSize: '12px', fontWeight: 700 },
  miniBarOuter: { height: '3px', background: '#1e293b', borderRadius: '2px', overflow: 'hidden' },
  miniBarInner: { height: '100%', borderRadius: '2px', transition: 'width 0.5s ease' },
  lastUpdated: { fontSize: '11px', color: '#475569', padding: '16px 8px 0', borderTop: '1px solid #1e293b', marginTop: '12px' },

  // Task area
  taskArea: { flex: 1, padding: '32px', overflowY: 'auto' },
  phaseHeader: { marginBottom: '28px' },
  phaseTitle: { fontSize: '22px', fontWeight: 700, margin: '0 0 6px', color: '#f1f5f9' },
  phaseDesc: { fontSize: '14px', color: '#94a3b8', margin: '0 0 16px' },
  phaseStats: { display: 'flex', gap: '12px', alignItems: 'center' },
  statBadge: { fontSize: '13px', color: '#94a3b8', fontWeight: 500 },
  statusBadge: { fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '20px' },

  // Task rows
  taskList: { display: 'flex', flexDirection: 'column', gap: '2px' },
  taskRow: {
    padding: '12px 16px',
    borderRadius: '8px',
    background: '#1e293b',
    border: '1px solid #1e293b',
    transition: 'all 0.15s',
  },
  taskRowDone: { opacity: 0.65, background: '#0f172a', border: '1px solid transparent' },
  taskMain: { display: 'flex', alignItems: 'flex-start', gap: '12px' },
  checkbox: {
    width: '22px', height: '22px', minWidth: '22px',
    borderRadius: '6px', border: '2px solid #475569',
    background: 'transparent', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s', marginTop: '1px', padding: 0,
  },
  checkboxDone: { background: '#22c55e', borderColor: '#22c55e' },
  checkmark: { color: '#fff', fontSize: '13px', fontWeight: 700, lineHeight: 1 },
  taskContent: { flex: 1, display: 'flex', gap: '8px', alignItems: 'baseline', flexWrap: 'wrap' },
  taskId: {
    fontSize: '11px', fontWeight: 700, color: '#475569',
    fontFamily: '"SF Mono", "Fira Code", monospace',
    minWidth: '32px',
  },
  taskLabel: { fontSize: '14px', color: '#cbd5e1', lineHeight: 1.5 },
  taskLabelDone: { textDecoration: 'line-through', color: '#64748b' },
  noteToggle: {
    background: 'none', border: 'none', color: '#475569',
    fontSize: '14px', cursor: 'pointer', padding: '2px 6px',
    borderRadius: '4px', minWidth: '28px',
  },

  // Notes
  noteDisplay: {
    marginLeft: '34px', marginTop: '6px',
    fontSize: '12px', color: '#64748b',
    fontStyle: 'italic', paddingLeft: '8px',
    borderLeft: '2px solid #334155',
  },
  noteEditor: {
    display: 'flex', gap: '8px', marginLeft: '34px', marginTop: '8px',
  },
  noteInput: {
    flex: 1, padding: '6px 10px', borderRadius: '6px',
    border: '1px solid #334155', background: '#0f172a',
    color: '#e2e8f0', fontSize: '13px', outline: 'none',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  noteSave: {
    padding: '6px 14px', borderRadius: '6px',
    background: '#3b82f6', border: 'none',
    color: '#fff', fontSize: '12px', fontWeight: 600,
    cursor: 'pointer',
  },
  noteCancel: {
    padding: '6px 14px', borderRadius: '6px',
    background: 'transparent', border: '1px solid #334155',
    color: '#94a3b8', fontSize: '12px',
    cursor: 'pointer',
  },
}
