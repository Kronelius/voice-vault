import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

/* ───────────────────────────────────────────
   Project Phases & Tasks — Single Source of Truth
   ─────────────────────────────────────────── */
const PROJECT_OVERVIEW = {
  id: 'overview',
  name: 'Project Overview',
  icon: '📊',
  vision: 'A fully integrated SEO content generation engine that captures your unique writing voice, researches high-value keyword opportunities, and produces voice-matched, SEO-optimized content at scale.',
  stack: [
    { label: 'Frontend', value: 'React 19 + Vite 8, Tailwind CSS 4' },
    { label: 'Backend', value: 'Vercel Serverless Functions (Node.js)' },
    { label: 'Database', value: 'Supabase (PostgreSQL + Row-Level Security)' },
    { label: 'AI', value: 'Anthropic Claude API (content generation, voice matching, analysis)' },
    { label: 'SEO APIs', value: 'DataForSEO, Serper.dev, Google Search Console' },
    { label: 'Hosting', value: 'Vercel (auto-deploy from GitHub master)' },
    { label: 'Repo', value: 'github.com/Kronelius/voice-vault' },
  ],
  pipeline: [
    {
      group: 'Onboarding & Setup',
      color: '#22c55e',
      icon: '🏁',
      desc: 'One-time setup to get the system running',
      steps: [
        { id: 'wf-01', icon: '🌐', label: 'Add Website', sub: 'Connect domain, verify ownership, link Google Search Console' },
        { id: 'wf-02', icon: '🕷️', label: 'Crawl & Audit', sub: 'Map site structure, internal links, find technical SEO issues' },
        { id: 'wf-03', icon: '🎙️', label: 'Build Voice Profile', sub: 'Upload writing samples, extract voice chunks, define tone & style' },
      ],
    },
    {
      group: 'Research & Strategy',
      color: '#3b82f6',
      icon: '🔍',
      desc: 'Understand the competitive landscape and find opportunities',
      steps: [
        { id: 'wf-04', icon: '🔑', label: 'Discover Keywords', sub: 'Pull search volumes, difficulty, competitor gaps, trending terms' },
        { id: 'wf-05', icon: '🧮', label: 'Score & Cluster', sub: 'Rank opportunities by ROI, group into topic clusters, map intent' },
        { id: 'wf-06', icon: '📋', label: 'Generate Brief', sub: 'Target keyword, heading structure, word count, entities, internal links' },
      ],
    },
    {
      group: 'Content Production',
      color: '#8b5cf6',
      icon: '✍️',
      desc: 'Generate and refine voice-matched, SEO-optimized content',
      steps: [
        { id: 'wf-07', icon: '✍️', label: 'Draft Content', sub: 'AI writes voice-matched, SEO-optimized article from brief + profile' },
        { id: 'wf-08', icon: '🔬', label: 'Review & Refine', sub: 'Content Lab editing, AI review, readability tuning, SEO scoring' },
        { id: 'wf-09', icon: '🚀', label: 'Publish', sub: 'Push to CMS with meta tags, schema markup, internal links' },
      ],
    },
    {
      group: 'Performance & Optimization',
      color: '#f59e0b',
      icon: '📊',
      desc: 'Close the loop — track, detect decay, and continuously improve',
      steps: [
        { id: 'wf-10', icon: '📊', label: 'Track Performance', sub: 'Monitor rankings, traffic, CTR, engagement per article' },
        { id: 'wf-11', icon: '🔄', label: 'Detect & Refresh', sub: 'Flag decaying content, suggest updates, re-optimize & republish' },
      ],
    },
  ],
  architecture: [
    { label: 'Voice Vault', desc: 'Voice profiling, writing samples, content editing with AI review — the foundation that makes generated content sound like you.' },
    { label: 'Website Scraping', desc: 'Crawl target sites, map internal link structure, audit technical SEO issues, track changes over time.' },
    { label: 'Keyword Intelligence', desc: 'Research volumes, difficulty, competitors, and content gaps. Cluster keywords into topics and score opportunities.' },
    { label: 'Content Strategy', desc: 'Map keywords to content types, build topic clusters, generate briefs, plan editorial calendar.' },
    { label: 'Content Generation', desc: 'Voice-matched, keyword-targeted drafts with SEO scoring, schema markup, and optimization suggestions.' },
    { label: 'Performance Loop', desc: 'Rank tracking, traffic analytics, content decay detection, refresh recommendations, ROI reporting.' },
  ],
}

const PROJECT_PHASES = [
  {
    id: 'phase-1',
    name: 'Phase 1 — Voice Vault Foundation',
    description: 'Core CMS, voice profiling, and design system',
    icon: '🏗️',
    color: '#22c55e',
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
    icon: '🤖',
    color: '#8b5cf6',
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
    icon: '🕷️',
    color: '#f59e0b',
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
    icon: '🔑',
    color: '#3b82f6',
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
    icon: '🗺️',
    color: '#ec4899',
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
    icon: '✍️',
    color: '#14b8a6',
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
    icon: '📊',
    color: '#f97316',
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
    icon: '🚀',
    color: '#6366f1',
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
  const [activePhase, setActivePhase] = useState('overview')
  const [lastUpdated, setLastUpdated] = useState(null)
  const [teamNotes, setTeamNotes] = useState('')
  const [editingTeamNotes, setEditingTeamNotes] = useState(false)
  const [teamNoteDraft, setTeamNoteDraft] = useState('')
  const [expandedTask, setExpandedTask] = useState(null)
  const [expandedWfStep, setExpandedWfStep] = useState(null)
  const [wfNoteValue, setWfNoteValue] = useState('')
  const [editingWfNote, setEditingWfNote] = useState(null)

  const DEV_PIN = '1234'

  useEffect(() => {
    if (sessionStorage.getItem('dev_auth') === 'true') setAuthenticated(true)
  }, [])

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
      if (row.task_id === 'team_notes') {
        setTeamNotes(row.notes || '')
        return
      }
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
      await supabase.from('project_tasks').upsert({
        task_id: taskId, completed: false, completed_by: null, completed_at: null,
        updated_at: new Date().toISOString(),
      })
      setCompletedTasks(prev => { const next = { ...prev }; delete next[taskId]; return next })
    } else {
      const now = new Date().toISOString()
      await supabase.from('project_tasks').upsert({
        task_id: taskId, completed: true, completed_by: 'dev', completed_at: now, updated_at: now,
      })
      setCompletedTasks(prev => ({ ...prev, [taskId]: { by: 'dev', at: now } }))
    }
    setSaving(false)
  }

  async function saveNote(taskId) {
    setSaving(true)
    await supabase.from('project_tasks').upsert({
      task_id: taskId, notes: noteValue || null, updated_at: new Date().toISOString(),
    })
    setTaskNotes(prev => noteValue ? { ...prev, [taskId]: noteValue } : (() => { const n = { ...prev }; delete n[taskId]; return n })())
    setEditingNote(null)
    setNoteValue('')
    setSaving(false)
  }

  async function saveTeamNotes() {
    setSaving(true)
    await supabase.from('project_tasks').upsert({
      task_id: 'team_notes', notes: teamNoteDraft, updated_at: new Date().toISOString(),
    })
    setTeamNotes(teamNoteDraft)
    setEditingTeamNotes(false)
    setSaving(false)
  }

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
      <div className="dev-dash" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1a1033 50%, #0f172a 100%)' }}>
        <style>{devStyles}</style>
        <div className="login-card">
          <div className="login-glow" />
          <div style={{ fontSize: '56px', marginBottom: '8px' }}>🔧</div>
          <h1 className="login-title">Dev Dashboard</h1>
          <p className="login-sub">Enter developer PIN to continue</p>
          <div className="pin-row">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`pin-dot ${pin.length > i ? 'filled' : ''} ${pinError ? 'error' : ''}`} />
            ))}
          </div>
          <div className="numpad">
            {[1,2,3,4,5,6,7,8,9,null,0,'⌫'].map((key, i) => (
              <button
                key={i}
                className={`num-key ${key === null ? 'empty' : ''} ${key === '⌫' ? 'del' : ''}`}
                onClick={() => {
                  if (key === null) return
                  if (key === '⌫') { setPin(p => p.slice(0, -1)); setPinError(false); return }
                  const next = pin + key
                  setPin(next); setPinError(false)
                  if (next.length === 4) {
                    if (next === DEV_PIN) { sessionStorage.setItem('dev_auth', 'true'); setAuthenticated(true) }
                    else { setPinError(true); setTimeout(() => setPin(''), 400) }
                  }
                }}
                disabled={key === null}
              >{key}</button>
            ))}
          </div>
          <button className="back-link" onClick={() => navigate('/')}>← Back to Voice Vault</button>
        </div>
      </div>
    )
  }

  const activePhaseData = PROJECT_PHASES.find(p => p.id === activePhase)
  const activeColor = activePhaseData?.color || '#3b82f6'

  /* ─── Main Dashboard ─── */
  return (
    <div className="dev-dash">
      <style>{devStyles}</style>

      {/* Top Bar */}
      <header className="top-bar">
        <div className="top-left">
          <div className="logo-mark">⚡</div>
          <div>
            <h1 className="top-title">SEO Content Engine</h1>
            <p className="top-sub">Development Status Dashboard</p>
          </div>
        </div>
        <div className="top-right">
          <div className="overall-progress">
            <div className="progress-header">
              <span className="progress-label">Overall Progress</span>
              <span className="progress-pct">{overallProgress}%</span>
            </div>
            <div className="progress-bar-outer">
              <div className="progress-bar-inner" style={{ width: `${overallProgress}%` }} />
            </div>
            <span className="progress-detail">{totalCompleted} of {totalTasks} tasks complete</span>
          </div>
          <button className="vault-link" onClick={() => navigate('/')}>
            <span style={{ fontSize: '16px' }}>🏠</span> Voice Vault
          </button>
        </div>
      </header>

      <div className="dash-body">
        {/* Phase Sidebar */}
        <nav className="phase-sidebar">
          {/* Overview Button */}
          <button
            className={`phase-item overview-item ${activePhase === 'overview' ? 'active' : ''}`}
            onClick={() => { setActivePhase('overview'); setExpandedTask(null) }}
            style={{ '--phase-color': '#6366f1', marginBottom: '16px' }}
          >
            <div className="phase-item-row">
              <span className="phase-icon">📊</span>
              <span className="phase-item-name" style={{ fontWeight: 800 }}>Project Overview</span>
            </div>
          </button>
          <div className="phase-list-label">DEVELOPMENT PHASES</div>
          {PROJECT_PHASES.map(phase => {
            const stats = getPhaseStats(phase)
            const isActive = phase.id === activePhase
            return (
              <button
                key={phase.id}
                className={`phase-item ${isActive ? 'active' : ''}`}
                onClick={() => { setActivePhase(phase.id); setExpandedTask(null) }}
                style={{ '--phase-color': phase.color }}
              >
                <div className="phase-item-row">
                  <span className="phase-icon">{phase.icon}</span>
                  <span className="phase-item-name">{phase.name.replace(/Phase \d+ — /, '')}</span>
                  <span className="phase-item-pct" style={{ color: stats.pct === 100 ? '#22c55e' : stats.pct > 0 ? '#f59e0b' : '#475569' }}>
                    {stats.pct}%
                  </span>
                </div>
                <div className="mini-bar-outer">
                  <div className="mini-bar-inner" style={{
                    width: `${stats.pct}%`,
                    background: stats.pct === 100 ? '#22c55e' : stats.pct > 0 ? phase.color : '#1e293b',
                  }} />
                </div>
              </button>
            )
          })}

          {/* Quick Stats */}
          <div className="sidebar-stats">
            <div className="stat-card">
              <span className="stat-num">{PROJECT_PHASES.filter(p => getPhaseStats(p).pct === 100).length}</span>
              <span className="stat-label">Phases Done</span>
            </div>
            <div className="stat-card">
              <span className="stat-num">{totalCompleted}</span>
              <span className="stat-label">Tasks Done</span>
            </div>
            <div className="stat-card">
              <span className="stat-num">{totalTasks - totalCompleted}</span>
              <span className="stat-label">Remaining</span>
            </div>
          </div>

          {lastUpdated && (
            <div className="last-updated">Last sync: {new Date(lastUpdated).toLocaleDateString()}</div>
          )}
        </nav>

        {/* Split Task Area */}
        <main className="task-area-split">
          {/* ─── OVERVIEW MODE ─── */}
          {activePhase === 'overview' ? (
            <div className="overview-pane">
              {/* Hero */}
              <div className="overview-hero">
                <div className="overview-hero-glow" />
                <h2 className="overview-hero-title">SEO Content Engine</h2>
                <p className="overview-hero-vision">{PROJECT_OVERVIEW.vision}</p>
                <div className="overview-stats-row">
                  <div className="overview-stat-chip">
                    <span className="overview-stat-num">{PROJECT_PHASES.length}</span>
                    <span className="overview-stat-txt">Phases</span>
                  </div>
                  <div className="overview-stat-chip">
                    <span className="overview-stat-num">{totalTasks}</span>
                    <span className="overview-stat-txt">Tasks</span>
                  </div>
                  <div className="overview-stat-chip">
                    <span className="overview-stat-num">{overallProgress}%</span>
                    <span className="overview-stat-txt">Complete</span>
                  </div>
                  <div className="overview-stat-chip">
                    <span className="overview-stat-num">{totalCompleted}</span>
                    <span className="overview-stat-txt">Done</span>
                  </div>
                </div>
              </div>

              {/* Pipeline Workflow — Grouped */}
              <div className="overview-card" style={{ marginTop: '0' }}>
                <h3 className="overview-card-title"><span>⚡</span> System Workflow — How It All Works</h3>
                <p className="pipeline-subtitle">The full user journey from onboarding to continuous content optimization. Click any step to add notes.</p>
                <div className="wf-groups">
                  {PROJECT_OVERVIEW.pipeline.map((group, gi) => (
                    <div key={gi} className="wf-group" style={{ '--wf-color': group.color }}>
                      <div className="wf-group-header">
                        <span className="wf-group-icon">{group.icon}</span>
                        <div>
                          <h4 className="wf-group-title">{group.group}</h4>
                          <p className="wf-group-desc">{group.desc}</p>
                        </div>
                      </div>
                      <div className="wf-steps">
                        {group.steps.map((step) => {
                          const isExpanded = expandedWfStep === step.id
                          const note = taskNotes[step.id]
                          const isEditing = editingWfNote === step.id
                          return (
                            <div key={step.id} className={`wf-step ${isExpanded ? 'expanded' : ''}`} style={{ '--wf-color': group.color }}>
                              <div className="wf-step-row" onClick={() => setExpandedWfStep(isExpanded ? null : step.id)}>
                                <div className="wf-step-icon">{step.icon}</div>
                                <div className="wf-step-body">
                                  <div className="wf-step-label">{step.label}</div>
                                  <div className="wf-step-sub">{step.sub}</div>
                                </div>
                                {note && <span className="has-note-badge" title="Has notes">📝</span>}
                                <span className="wf-step-chevron">{isExpanded ? '▾' : '▸'}</span>
                              </div>
                              {isExpanded && (
                                <div className="wf-step-detail">
                                  {isEditing ? (
                                    <div className="wf-note-editor">
                                      <textarea
                                        className="detail-note-textarea"
                                        value={wfNoteValue}
                                        onChange={e => setWfNoteValue(e.target.value)}
                                        placeholder={"Add notes for this step...\n\nIdeas:\n- Architecture decisions\n- API choices\n- Open questions\n- Dependencies"}
                                        autoFocus
                                        rows={6}
                                      />
                                      <div className="note-actions">
                                        <button className="note-btn save" onClick={async () => {
                                          setSaving(true)
                                          await supabase.from('project_tasks').upsert({
                                            task_id: step.id, notes: wfNoteValue || null, updated_at: new Date().toISOString(),
                                          })
                                          setTaskNotes(prev => wfNoteValue ? { ...prev, [step.id]: wfNoteValue } : (() => { const n = { ...prev }; delete n[step.id]; return n })())
                                          setEditingWfNote(null)
                                          setWfNoteValue('')
                                          setSaving(false)
                                        }} disabled={saving}>
                                          {saving ? 'Saving...' : 'Save Note'}
                                        </button>
                                        <button className="note-btn cancel" onClick={() => { setEditingWfNote(null); setWfNoteValue('') }}>Cancel</button>
                                      </div>
                                    </div>
                                  ) : note ? (
                                    <div className="wf-note-display" onClick={() => { setEditingWfNote(step.id); setWfNoteValue(note) }}>
                                      {note.split('\n').map((line, i) => (
                                        <p key={i}>{line || '\u00A0'}</p>
                                      ))}
                                      <div className="detail-note-edit-hint">Click to edit</div>
                                    </div>
                                  ) : (
                                    <div className="wf-note-empty" onClick={() => { setEditingWfNote(step.id); setWfNoteValue('') }}>
                                      <p>No notes yet. Click to add notes for this workflow step.</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pipeline-loop-note">
                  <span>🔁</span> Research → Production → Performance loops continuously — the system finds new opportunities, generates content, and optimizes existing pages in an ongoing cycle.
                </div>
              </div>

              <div className="overview-grid">
                {/* Tech Stack */}
                <div className="overview-card">
                  <h3 className="overview-card-title"><span>🛠️</span> Tech Stack</h3>
                  <div className="overview-stack-list">
                    {PROJECT_OVERVIEW.stack.map((item, i) => (
                      <div key={i} className="overview-stack-row">
                        <span className="overview-stack-label">{item.label}</span>
                        <span className="overview-stack-value">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Architecture */}
                <div className="overview-card">
                  <h3 className="overview-card-title"><span>🏗️</span> Architecture</h3>
                  <div className="overview-arch-list">
                    {PROJECT_OVERVIEW.architecture.map((item, i) => (
                      <div key={i} className="overview-arch-item">
                        <div className="overview-arch-label">{item.label}</div>
                        <p className="overview-arch-desc">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Phase Roadmap */}
              <div className="overview-card" style={{ marginTop: '0' }}>
                <h3 className="overview-card-title"><span>🗺️</span> Phase Roadmap</h3>
                <div className="overview-roadmap">
                  {PROJECT_PHASES.map((phase, i) => {
                    const stats = getPhaseStats(phase)
                    return (
                      <div
                        key={phase.id}
                        className={`overview-roadmap-item ${stats.pct === 100 ? 'complete' : stats.pct > 0 ? 'in-progress' : 'upcoming'}`}
                        onClick={() => { setActivePhase(phase.id); setExpandedTask(null) }}
                      >
                        <div className="roadmap-connector">
                          <div className="roadmap-dot" style={{ background: stats.pct === 100 ? '#22c55e' : stats.pct > 0 ? phase.color : '#334155' }} />
                          {i < PROJECT_PHASES.length - 1 && <div className="roadmap-line" style={{ background: stats.pct === 100 ? '#22c55e44' : '#1e293b' }} />}
                        </div>
                        <div className="roadmap-content">
                          <div className="roadmap-top-row">
                            <span className="roadmap-icon">{phase.icon}</span>
                            <span className="roadmap-name">{phase.name}</span>
                            <span className="roadmap-pct" style={{ color: stats.pct === 100 ? '#22c55e' : stats.pct > 0 ? phase.color : '#475569' }}>{stats.pct}%</span>
                          </div>
                          <p className="roadmap-desc">{phase.description}</p>
                          <div className="roadmap-bar-outer">
                            <div className="roadmap-bar-inner" style={{ width: `${stats.pct}%`, background: stats.pct === 100 ? '#22c55e' : phase.color }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
          <>
          {/* ─── LEFT: Task List (50%) ─── */}
          <div className="task-list-pane">
            {activePhaseData && (
              <>
                {/* Phase Header */}
                <div className="phase-header" style={{ '--phase-color': activeColor }}>
                  <div className="phase-header-icon">{activePhaseData.icon}</div>
                  <div className="phase-header-text">
                    <h2 className="phase-title">{activePhaseData.name}</h2>
                    <p className="phase-desc">{activePhaseData.description}</p>
                  </div>
                  <div className="phase-header-stats">
                    {(() => {
                      const s = getPhaseStats(activePhaseData)
                      return (
                        <>
                          <div className="phase-ring" style={{ '--ring-pct': s.pct, '--ring-color': activeColor }}>
                            <svg viewBox="0 0 36 36" className="ring-svg">
                              <path className="ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                              <path className="ring-fill" strokeDasharray={`${s.pct}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" style={{ stroke: activeColor }} />
                            </svg>
                            <span className="ring-text">{s.pct}%</span>
                          </div>
                          <span className="phase-stat-detail">{s.done}/{s.total} tasks</span>
                        </>
                      )
                    })()}
                  </div>
                </div>

                {/* Task Cards */}
                <div className="task-list">
                  {activePhaseData.tasks.map((task, idx) => {
                    const isDone = task.status === 'done' || !!completedTasks[task.id]
                    const isHardcoded = task.status === 'done'
                    const note = taskNotes[task.id]
                    const isSelected = expandedTask === task.id

                    return (
                      <div
                        key={task.id}
                        className={`task-card ${isDone ? 'done' : ''} ${isSelected ? 'selected' : ''}`}
                        style={{ '--task-color': activeColor, animationDelay: `${idx * 30}ms` }}
                        onClick={() => setExpandedTask(isSelected ? null : task.id)}
                      >
                        <div className="task-top">
                          <button
                            className={`task-check ${isDone ? 'checked' : ''}`}
                            style={isDone ? { background: activeColor, borderColor: activeColor } : {}}
                            onClick={(e) => { e.stopPropagation(); !isHardcoded && toggleTask(task.id) }}
                            disabled={isHardcoded || saving}
                          >
                            {isDone && (
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </button>
                          <div className="task-body">
                            <div className="task-id-badge" style={{ background: isDone ? `${activeColor}22` : '#1e293b', color: isDone ? activeColor : '#64748b' }}>
                              {task.id}
                            </div>
                            <p className={`task-label ${isDone ? 'done' : ''}`}>{task.label}</p>
                          </div>
                          <div className="task-indicators">
                            {note && <span className="has-note-badge" title="Has notes">📝</span>}
                            <div className={`task-status-pill ${isDone ? 'done' : 'pending'}`} style={isDone ? { background: `${activeColor}22`, color: activeColor } : {}}>
                              {isDone ? (isHardcoded ? 'Shipped' : 'Done') : 'To Do'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* ─── RIGHT: Detail / Notes Panel (50%) ─── */}
          <div className="detail-pane">
            {expandedTask ? (() => {
              const task = activePhaseData?.tasks.find(t => t.id === expandedTask)
              if (!task) return null
              const isDone = task.status === 'done' || !!completedTasks[task.id]
              const isHardcoded = task.status === 'done'
              const note = taskNotes[task.id]
              const completionInfo = completedTasks[task.id]
              const isEditingThis = editingNote === task.id

              return (
                <div className="detail-content">
                  {/* Detail Header */}
                  <div className="detail-header">
                    <div className="detail-id-badge" style={{ background: `${activeColor}22`, color: activeColor }}>{task.id}</div>
                    <div className={`detail-status ${isDone ? 'done' : 'pending'}`} style={isDone ? { background: `${activeColor}22`, color: activeColor, borderColor: `${activeColor}44` } : {}}>
                      {isDone ? (isHardcoded ? '✓ Shipped' : '✓ Done') : '○ To Do'}
                    </div>
                  </div>
                  <h3 className="detail-title">{task.label}</h3>

                  {/* Meta info */}
                  <div className="detail-meta-section">
                    {isHardcoded && (
                      <div className="detail-meta-item">
                        <span className="detail-meta-icon">🚀</span>
                        <span>Built and deployed in production code</span>
                      </div>
                    )}
                    {completionInfo?.at && (
                      <div className="detail-meta-item">
                        <span className="detail-meta-icon">📅</span>
                        <span>Completed {new Date(completionInfo.at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        {completionInfo.by && <span className="detail-meta-by">by {completionInfo.by}</span>}
                      </div>
                    )}
                  </div>

                  {/* Notes Section */}
                  <div className="detail-notes-section">
                    <div className="detail-notes-label">
                      <span>📝</span>
                      <span>Task Notes</span>
                    </div>

                    {isEditingThis ? (
                      <div className="detail-note-editor">
                        <textarea
                          className="detail-note-textarea"
                          value={noteValue}
                          onChange={e => setNoteValue(e.target.value)}
                          placeholder={"Add notes for this task...\n\nIdeas:\n- Implementation approach\n- Blockers or dependencies\n- Who's working on it\n- Links to relevant docs/PRs"}
                          autoFocus
                          rows={10}
                        />
                        <div className="note-actions">
                          <button className="note-btn save" onClick={() => saveNote(task.id)} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Note'}
                          </button>
                          <button className="note-btn cancel" onClick={() => { setEditingNote(null); setNoteValue('') }}>Cancel</button>
                        </div>
                      </div>
                    ) : note ? (
                      <div className="detail-note-content" onClick={() => { setEditingNote(task.id); setNoteValue(note) }}>
                        {note.split('\n').map((line, i) => (
                          <p key={i}>{line || '\u00A0'}</p>
                        ))}
                        <div className="detail-note-edit-hint">Click to edit</div>
                      </div>
                    ) : (
                      <div className="detail-note-empty" onClick={() => { setEditingNote(task.id); setNoteValue('') }}>
                        <span style={{ fontSize: '28px', opacity: 0.4 }}>💬</span>
                        <p>No notes yet. Click to add notes.</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })() : (
              <div className="detail-empty">
                <span style={{ fontSize: '40px', opacity: 0.3 }}>👈</span>
                <p className="detail-empty-title">Select a task</p>
                <p className="detail-empty-sub">Click on any task to view details and add notes</p>
              </div>
            )}

            {/* ─── Team Notes (always visible at bottom of right pane) ─── */}
            <div className="team-notes-section">
              <div className="team-notes-header">
                <div className="team-notes-title-row">
                  <span style={{ fontSize: '20px' }}>📋</span>
                  <h2 className="team-notes-title">Team Notes</h2>
                </div>
                <p className="team-notes-sub">Shared scratchpad for decisions, blockers, and coordination</p>
              </div>

              {editingTeamNotes ? (
                <div className="team-notes-editor">
                  <textarea
                    className="team-notes-textarea"
                    value={teamNoteDraft}
                    onChange={e => setTeamNoteDraft(e.target.value)}
                    placeholder={"Write team notes here...\n\nExamples:\n- Decided to use DataForSEO as primary keyword API\n- @Dev2 handling the crawler, @Dev1 on keyword UI\n- Blocker: Need GSC access from client before Phase 4\n- Next sync: Thursday 3pm EST"}
                    autoFocus
                    rows={8}
                  />
                  <div className="team-notes-actions">
                    <button className="note-btn save" onClick={saveTeamNotes} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Notes'}
                    </button>
                    <button className="note-btn cancel" onClick={() => { setEditingTeamNotes(false); setTeamNoteDraft(teamNotes) }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="team-notes-display" onClick={() => { setEditingTeamNotes(true); setTeamNoteDraft(teamNotes) }}>
                  {teamNotes ? (
                    <div className="team-notes-content">
                      {teamNotes.split('\n').map((line, i) => (
                        <p key={i} className={line.trim() === '' ? 'empty-line' : ''}>{line || '\u00A0'}</p>
                      ))}
                    </div>
                  ) : (
                    <div className="team-notes-empty">
                      <span style={{ fontSize: '24px', opacity: 0.4 }}>💬</span>
                      <p>No team notes yet. Click to start writing.</p>
                    </div>
                  )}
                  <div className="team-notes-edit-hint">Click to edit</div>
                </div>
              )}
            </div>
          </div>
          </>
          )}
        </main>
      </div>
    </div>
  )
}

/* ───────────────────────────────────────────
   CSS — Embedded stylesheet
   ─────────────────────────────────────────── */
const devStyles = `
  .dev-dash {
    height: 100vh;
    overflow: hidden;
    background: linear-gradient(135deg, #0f172a 0%, #131b2e 50%, #0f172a 100%);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #e2e8f0;
    cursor: default;
  }

  /* ── Login ── */
  .login-card {
    position: relative;
    background: rgba(30, 41, 59, 0.8);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 24px;
    padding: 48px 40px;
    text-align: center;
    box-shadow: 0 25px 60px rgba(0,0,0,0.5), 0 0 80px rgba(99, 102, 241, 0.08);
    min-width: 340px;
    overflow: hidden;
  }
  .login-glow {
    position: absolute; top: -60px; left: 50%; transform: translateX(-50%);
    width: 200px; height: 200px; border-radius: 50%;
    background: radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%);
    pointer-events: none;
  }
  .login-title { color: #f1f5f9; font-size: 26px; font-weight: 800; margin: 0 0 6px; letter-spacing: -0.02em; }
  .login-sub { color: #94a3b8; font-size: 14px; margin: 0 0 32px; }
  .pin-row { display: flex; gap: 14px; justify-content: center; margin-bottom: 32px; }
  .pin-dot {
    width: 18px; height: 18px; border-radius: 50%;
    border: 2px solid #475569; background: transparent;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .pin-dot.filled { background: #6366f1; border-color: #6366f1; box-shadow: 0 0 12px rgba(99,102,241,0.5); }
  .pin-dot.error { background: #ef4444; border-color: #ef4444; box-shadow: 0 0 12px rgba(239,68,68,0.5); animation: shake 0.4s ease; }
  @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
  .numpad { display: grid; grid-template-columns: repeat(3, 68px); gap: 10px; justify-content: center; margin-bottom: 24px; }
  .num-key {
    width: 68px; height: 54px; border-radius: 12px;
    border: 1px solid #334155; background: rgba(15, 23, 42, 0.6);
    color: #e2e8f0; font-size: 22px; font-weight: 600;
    cursor: pointer; transition: all 0.15s;
  }
  .num-key:hover:not(.empty) { background: rgba(99, 102, 241, 0.15); border-color: #6366f1; }
  .num-key:active:not(.empty) { transform: scale(0.95); }
  .num-key.empty { visibility: hidden; }
  .num-key.del { font-size: 18px; color: #94a3b8; background: transparent; border-color: transparent; }
  .back-link { background: none; border: none; color: #64748b; font-size: 13px; cursor: pointer; margin-top: 8px; transition: color 0.15s; }
  .back-link:hover { color: #94a3b8; }

  /* ── Top Bar ── */
  .top-bar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 28px;
    background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(51, 65, 85, 0.5);
    position: sticky; top: 0; z-index: 20;
  }
  .top-left { display: flex; align-items: center; gap: 14px; }
  .logo-mark {
    font-size: 24px; width: 42px; height: 42px;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 12px; box-shadow: 0 4px 12px rgba(99,102,241,0.3);
  }
  .top-title { font-size: 17px; font-weight: 800; margin: 0; color: #f1f5f9; letter-spacing: -0.02em; }
  .top-sub { font-size: 11px; color: #64748b; margin: 0; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
  .top-right { display: flex; align-items: center; gap: 20px; }
  .overall-progress { min-width: 220px; }
  .progress-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; }
  .progress-label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
  .progress-pct { font-size: 18px; font-weight: 800; background: linear-gradient(90deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .progress-bar-outer { height: 8px; background: #1e293b; border-radius: 4px; overflow: hidden; }
  .progress-bar-inner { height: 100%; background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899); border-radius: 4px; transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1); position: relative; }
  .progress-bar-inner::after { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%); animation: shimmer 2s infinite; }
  @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
  .progress-detail { font-size: 11px; color: #475569; margin-top: 4px; display: block; }
  .vault-link {
    display: flex; align-items: center; gap: 8px;
    background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: 10px; padding: 8px 16px; color: #a5b4fc; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all 0.2s;
  }
  .vault-link:hover { background: rgba(99, 102, 241, 0.2); border-color: rgba(99, 102, 241, 0.5); }

  /* ── Body Layout ── */
  .dash-body { display: flex; height: calc(100vh - 71px); overflow: hidden; }

  /* ── Phase Sidebar ── */
  .phase-sidebar {
    width: 280px; min-width: 280px; border-right: 1px solid rgba(51,65,85,0.3);
    padding: 20px 14px; overflow-y: auto;
    background: rgba(15, 23, 42, 0.4);
  }
  .phase-list-label {
    font-size: 10px; font-weight: 800; letter-spacing: 0.12em;
    color: #475569; padding: 0 10px 14px; text-transform: uppercase;
  }
  .phase-item {
    display: block; width: 100%; text-align: left;
    padding: 12px 14px; margin-bottom: 4px;
    background: transparent; border: 1px solid transparent;
    border-radius: 12px; cursor: pointer; transition: all 0.2s; color: #94a3b8;
  }
  .phase-item:hover { background: rgba(30, 41, 59, 0.5); }
  .phase-item.active {
    background: rgba(30, 41, 59, 0.8); border-color: rgba(51, 65, 85, 0.6);
    color: #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    border-left: 3px solid var(--phase-color);
  }
  .phase-item-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .phase-icon { font-size: 18px; }
  .phase-item-name { flex: 1; font-size: 13px; font-weight: 600; }
  .phase-item-pct { font-size: 12px; font-weight: 800; font-variant-numeric: tabular-nums; }
  .mini-bar-outer { height: 3px; background: rgba(30,41,59,0.8); border-radius: 2px; overflow: hidden; margin-left: 28px; }
  .mini-bar-inner { height: 100%; border-radius: 2px; transition: width 0.5s ease; }

  .sidebar-stats {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
    margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(51,65,85,0.3);
  }
  .stat-card {
    text-align: center; padding: 10px 4px;
    background: rgba(30,41,59,0.5); border-radius: 10px;
    border: 1px solid rgba(51,65,85,0.3);
  }
  .stat-num { display: block; font-size: 20px; font-weight: 800; color: #f1f5f9; }
  .stat-label { display: block; font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.06em; margin-top: 2px; }
  .last-updated { font-size: 10px; color: #334155; padding: 12px 10px 0; text-align: center; }

  /* ── Split Task Area ── */
  .task-area-split { flex: 1; display: flex; height: 100%; overflow: hidden; }
  .task-list-pane {
    width: 50%; min-width: 0; padding: 20px 16px; overflow-y: auto;
    border-right: 1px solid rgba(51, 65, 85, 0.3);
    scrollbar-width: thin; scrollbar-color: #334155 transparent;
  }
  .detail-pane {
    width: 50%; min-width: 0; padding: 20px 24px; overflow-y: auto;
    display: flex; flex-direction: column; gap: 20px;
    scrollbar-width: thin; scrollbar-color: #334155 transparent;
  }
  .phase-sidebar { scrollbar-width: thin; scrollbar-color: #334155 transparent; }
  .overview-pane { scrollbar-width: thin; scrollbar-color: #334155 transparent; }

  /* ── Phase Header ── */
  .phase-header {
    display: flex; align-items: center; gap: 20px;
    padding: 24px 28px; margin-bottom: 24px;
    background: linear-gradient(135deg, rgba(30,41,59,0.6) 0%, rgba(30,41,59,0.3) 100%);
    border: 1px solid rgba(51,65,85,0.4); border-radius: 16px;
    border-left: 4px solid var(--phase-color);
  }
  .phase-header-icon { font-size: 40px; }
  .phase-header-text { flex: 1; }
  .phase-title { font-size: 20px; font-weight: 800; margin: 0 0 4px; color: #f1f5f9; letter-spacing: -0.02em; }
  .phase-desc { font-size: 13px; color: #94a3b8; margin: 0; line-height: 1.5; }
  .phase-header-stats { text-align: center; }
  .phase-ring { position: relative; width: 64px; height: 64px; }
  .ring-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
  .ring-bg { fill: none; stroke: #1e293b; stroke-width: 3; }
  .ring-fill { fill: none; stroke-width: 3; stroke-linecap: round; transition: stroke-dasharray 0.6s ease; }
  .ring-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); font-size: 14px; font-weight: 800; color: #f1f5f9; }
  .phase-stat-detail { display: block; font-size: 11px; color: #64748b; margin-top: 4px; font-weight: 600; }

  /* ── Task Cards ── */
  .task-list { display: flex; flex-direction: column; gap: 6px; }
  .task-card {
    background: rgba(30, 41, 59, 0.5);
    border: 1px solid rgba(51, 65, 85, 0.3);
    border-radius: 12px; padding: 14px 18px;
    transition: all 0.2s; cursor: default;
    animation: fadeSlideIn 0.3s ease both;
    border-left: 3px solid transparent;
  }
  .task-card:hover { background: rgba(30, 41, 59, 0.7); border-color: rgba(51, 65, 85, 0.5); cursor: pointer; }
  .task-card.done { border-left-color: var(--task-color); }
  .task-card.selected { background: rgba(99, 102, 241, 0.08); border-color: rgba(99, 102, 241, 0.3); box-shadow: 0 0 0 1px rgba(99,102,241,0.1); }
  @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

  .task-top { display: flex; align-items: flex-start; gap: 14px; }
  .task-check {
    width: 24px; height: 24px; min-width: 24px;
    border-radius: 8px; border: 2px solid #475569;
    background: transparent; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s; margin-top: 2px; padding: 0;
  }
  .task-check:hover:not(:disabled) { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
  .task-check.checked { box-shadow: 0 2px 8px rgba(0,0,0,0.2); }

  .task-body { flex: 1; cursor: pointer; display: flex; gap: 10px; align-items: flex-start; flex-wrap: wrap; }
  .task-id-badge {
    font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 6px;
    font-family: 'SF Mono', 'Fira Code', 'JetBrains Mono', monospace;
    letter-spacing: 0.02em; white-space: nowrap;
  }
  .task-label { font-size: 14px; color: #cbd5e1; line-height: 1.6; margin: 0; flex: 1; min-width: 200px; }
  .task-label.done { color: #64748b; }

  .task-status-pill {
    font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 20px;
    text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap;
  }
  .task-status-pill.pending {
    background: rgba(251, 191, 36, 0.15); color: #fbbf24;
    border: 1px solid rgba(251, 191, 36, 0.3);
    box-shadow: 0 0 8px rgba(251, 191, 36, 0.15);
  }

  .task-indicators { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .has-note-badge {
    font-size: 16px; width: 28px; height: 28px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(251, 191, 36, 0.15); border-radius: 8px;
    border: 1px solid rgba(251, 191, 36, 0.3);
    animation: notePulse 2s ease-in-out infinite;
  }
  @keyframes notePulse { 0%,100%{box-shadow: 0 0 0 0 rgba(251,191,36,0)} 50%{box-shadow: 0 0 0 4px rgba(251,191,36,0.1)} }

  /* ── Detail Pane ── */
  .detail-content { flex: 1; }
  .detail-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
  .detail-id-badge {
    font-size: 14px; font-weight: 800; padding: 6px 14px; border-radius: 8px;
    font-family: 'SF Mono', 'Fira Code', 'JetBrains Mono', monospace;
  }
  .detail-status {
    font-size: 12px; font-weight: 700; padding: 5px 14px; border-radius: 20px;
    border: 1px solid #334155;
  }
  .detail-status.pending { background: #1e293b; color: #64748b; }
  .detail-title { font-size: 17px; font-weight: 700; color: #f1f5f9; line-height: 1.6; margin: 0 0 20px; }

  .detail-meta-section { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
  .detail-meta-item {
    display: flex; align-items: center; gap: 8px;
    font-size: 13px; color: #94a3b8;
    padding: 8px 12px; border-radius: 8px;
    background: rgba(30, 41, 59, 0.5);
  }
  .detail-meta-icon { font-size: 14px; }
  .detail-meta-by { color: #64748b; margin-left: 4px; }

  .detail-notes-section { }
  .detail-notes-label {
    display: flex; align-items: center; gap: 8px;
    font-size: 13px; font-weight: 700; color: #94a3b8;
    text-transform: uppercase; letter-spacing: 0.05em;
    margin-bottom: 12px;
  }

  .detail-note-content {
    position: relative;
    background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(51, 65, 85, 0.4);
    border-radius: 12px; padding: 20px; min-height: 120px;
    cursor: pointer; transition: all 0.2s;
  }
  .detail-note-content:hover { border-color: rgba(99, 102, 241, 0.3); background: rgba(30, 41, 59, 0.7); }
  .detail-note-content p { margin: 0 0 6px; font-size: 14px; color: #cbd5e1; line-height: 1.7; }
  .detail-note-edit-hint {
    position: absolute; bottom: 10px; right: 14px;
    font-size: 10px; color: #334155; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
  }
  .detail-note-content:hover .detail-note-edit-hint { color: #6366f1; }

  .detail-note-empty {
    text-align: center; padding: 32px 20px;
    background: rgba(30, 41, 59, 0.3); border: 2px dashed rgba(51, 65, 85, 0.4);
    border-radius: 12px; cursor: pointer; transition: all 0.2s;
  }
  .detail-note-empty:hover { border-color: rgba(99, 102, 241, 0.3); background: rgba(99, 102, 241, 0.05); }
  .detail-note-empty p { color: #475569; font-size: 13px; margin: 8px 0 0; }

  .detail-note-editor { }
  .detail-note-textarea {
    width: 100%; padding: 16px 20px; border-radius: 12px;
    border: 1px solid rgba(99, 102, 241, 0.3); background: rgba(15, 23, 42, 0.6);
    color: #e2e8f0; font-size: 14px; line-height: 1.7; resize: vertical;
    font-family: inherit; outline: none; min-height: 160px;
    box-sizing: border-box; transition: border-color 0.2s;
  }
  .detail-note-textarea:focus { border-color: rgba(99, 102, 241, 0.6); box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }

  .detail-empty {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 8px;
  }
  .detail-empty-title { font-size: 16px; font-weight: 700; color: #475569; margin: 0; }
  .detail-empty-sub { font-size: 13px; color: #334155; margin: 0; }
  .note-actions { display: flex; gap: 8px; margin-top: 8px; }
  .note-btn {
    padding: 7px 16px; border-radius: 8px; font-size: 12px; font-weight: 700;
    cursor: pointer; transition: all 0.15s; border: none;
  }
  .note-btn.save { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; }
  .note-btn.save:hover { box-shadow: 0 4px 12px rgba(99,102,241,0.4); transform: translateY(-1px); }
  .note-btn.cancel { background: transparent; border: 1px solid #334155; color: #94a3b8; }
  .note-btn.cancel:hover { border-color: #475569; }

  /* ── Team Notes Section ── */
  .team-notes-section {
    margin-top: 40px; padding-top: 32px;
    border-top: 2px solid rgba(51, 65, 85, 0.3);
  }
  .team-notes-header { margin-bottom: 16px; }
  .team-notes-title-row { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; }
  .team-notes-title { font-size: 20px; font-weight: 800; margin: 0; color: #f1f5f9; letter-spacing: -0.02em; }
  .team-notes-sub { font-size: 13px; color: #64748b; margin: 0; }

  .team-notes-display {
    position: relative;
    background: rgba(30, 41, 59, 0.5);
    border: 1px solid rgba(51, 65, 85, 0.4);
    border-radius: 16px; padding: 24px; min-height: 180px;
    cursor: pointer; transition: all 0.2s;
  }
  .team-notes-display:hover { background: rgba(30, 41, 59, 0.7); border-color: rgba(99, 102, 241, 0.2); }
  .team-notes-content p { margin: 0 0 6px; font-size: 14px; color: #cbd5e1; line-height: 1.7; }
  .team-notes-content .empty-line { height: 10px; }
  .team-notes-empty { text-align: center; padding: 24px; }
  .team-notes-empty p { color: #475569; font-size: 14px; margin: 8px 0 0; }
  .team-notes-edit-hint {
    position: absolute; bottom: 12px; right: 16px;
    font-size: 11px; color: #334155; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.05em; transition: color 0.15s;
  }
  .team-notes-display:hover .team-notes-edit-hint { color: #6366f1; }

  .team-notes-editor { margin-top: 8px; }
  .team-notes-textarea {
    width: 100%; padding: 20px; border-radius: 16px;
    border: 1px solid rgba(99, 102, 241, 0.3); background: rgba(15, 23, 42, 0.6);
    color: #e2e8f0; font-size: 14px; line-height: 1.7; resize: vertical;
    font-family: inherit; outline: none; min-height: 200px;
    box-sizing: border-box; transition: border-color 0.2s;
  }
  .team-notes-textarea:focus { border-color: rgba(99, 102, 241, 0.6); box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
  .team-notes-actions { display: flex; gap: 8px; margin-top: 12px; }

  /* ── Overview Item in Sidebar ── */
  .overview-item { border-bottom: 1px solid rgba(51, 65, 85, 0.3); padding-bottom: 14px; }
  .overview-item .mini-bar-outer { display: none; }

  /* ── Overview Pane ── */
  .overview-pane {
    flex: 1; padding: 28px 32px; overflow-y: auto;
    max-height: calc(100vh - 71px);
    display: flex; flex-direction: column; gap: 24px;
  }

  .overview-hero {
    position: relative; overflow: hidden;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.08) 50%, rgba(236, 72, 153, 0.06) 100%);
    border: 1px solid rgba(99, 102, 241, 0.25);
    border-radius: 20px; padding: 36px 40px;
  }
  .overview-hero-glow {
    position: absolute; top: -80px; right: -80px;
    width: 250px; height: 250px; border-radius: 50%;
    background: radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%);
    pointer-events: none;
  }
  .overview-hero-title {
    font-size: 28px; font-weight: 900; margin: 0 0 12px;
    background: linear-gradient(135deg, #e2e8f0, #a5b4fc);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    letter-spacing: -0.03em;
  }
  .overview-hero-vision {
    font-size: 15px; color: #94a3b8; line-height: 1.7; margin: 0 0 24px;
    max-width: 680px;
  }
  .overview-stats-row { display: flex; gap: 16px; flex-wrap: wrap; }
  .overview-stat-chip {
    display: flex; align-items: baseline; gap: 6px;
    background: rgba(15, 23, 42, 0.5); border: 1px solid rgba(51, 65, 85, 0.4);
    border-radius: 12px; padding: 10px 18px;
  }
  .overview-stat-num {
    font-size: 22px; font-weight: 900; color: #f1f5f9;
    font-variant-numeric: tabular-nums;
  }
  .overview-stat-txt {
    font-size: 11px; color: #64748b; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.06em;
  }

  .overview-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
  }
  @media (max-width: 1200px) {
    .overview-grid { grid-template-columns: 1fr; }
  }

  .overview-card {
    background: rgba(30, 41, 59, 0.5);
    border: 1px solid rgba(51, 65, 85, 0.4);
    border-radius: 16px; padding: 24px 28px;
  }
  .overview-card-title {
    display: flex; align-items: center; gap: 10px;
    font-size: 16px; font-weight: 800; color: #f1f5f9;
    margin: 0 0 20px; letter-spacing: -0.01em;
  }
  .overview-card-title span { font-size: 20px; }

  /* Stack rows */
  .overview-stack-list { display: flex; flex-direction: column; gap: 8px; }
  .overview-stack-row {
    display: flex; align-items: baseline; gap: 12px;
    padding: 8px 12px; border-radius: 8px;
    background: rgba(15, 23, 42, 0.4);
  }
  .overview-stack-label {
    font-size: 11px; font-weight: 800; color: #64748b;
    text-transform: uppercase; letter-spacing: 0.06em;
    min-width: 80px;
  }
  .overview-stack-value { font-size: 13px; color: #cbd5e1; }

  /* Architecture items */
  .overview-arch-list { display: flex; flex-direction: column; gap: 14px; }
  .overview-arch-item { padding-left: 14px; border-left: 3px solid rgba(99, 102, 241, 0.3); }
  .overview-arch-label { font-size: 13px; font-weight: 800; color: #a5b4fc; margin-bottom: 4px; }
  .overview-arch-desc { font-size: 13px; color: #94a3b8; line-height: 1.6; margin: 0; }

  /* Roadmap */
  .overview-roadmap { display: flex; flex-direction: column; }
  .overview-roadmap-item {
    display: flex; gap: 20px; cursor: pointer;
    padding: 12px 0; transition: all 0.15s;
  }
  .overview-roadmap-item:hover { opacity: 0.85; }
  .overview-roadmap-item:hover .roadmap-name { color: #a5b4fc; }
  .roadmap-connector {
    display: flex; flex-direction: column; align-items: center;
    width: 20px; flex-shrink: 0; padding-top: 4px;
  }
  .roadmap-dot {
    width: 14px; height: 14px; border-radius: 50%;
    border: 2px solid rgba(51, 65, 85, 0.6); flex-shrink: 0;
  }
  .roadmap-line { width: 2px; flex: 1; min-height: 20px; margin-top: 4px; }
  .roadmap-content { flex: 1; min-width: 0; }
  .roadmap-top-row { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
  .roadmap-icon { font-size: 18px; }
  .roadmap-name { font-size: 14px; font-weight: 700; color: #e2e8f0; flex: 1; transition: color 0.15s; }
  .roadmap-pct { font-size: 13px; font-weight: 800; font-variant-numeric: tabular-nums; }
  .roadmap-desc { font-size: 12px; color: #64748b; margin: 0 0 8px; line-height: 1.5; }
  .roadmap-bar-outer { height: 4px; background: #1e293b; border-radius: 2px; overflow: hidden; }
  .roadmap-bar-inner { height: 100%; border-radius: 2px; transition: width 0.6s ease; }

  /* ── Pipeline Workflow (Grouped) ── */
  .pipeline-subtitle {
    font-size: 13px; color: #64748b; margin: -12px 0 20px; line-height: 1.5;
  }
  .wf-groups { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media (max-width: 1100px) { .wf-groups { grid-template-columns: 1fr; } }

  .wf-group {
    background: rgba(15, 23, 42, 0.4);
    border: 1px solid rgba(51, 65, 85, 0.4);
    border-radius: 14px; padding: 18px;
    border-top: 3px solid var(--wf-color);
  }
  .wf-group-header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
  .wf-group-icon {
    font-size: 22px; width: 40px; height: 40px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(15, 23, 42, 0.6); border-radius: 10px;
    border: 1px solid rgba(51, 65, 85, 0.4);
  }
  .wf-group-title { font-size: 14px; font-weight: 800; color: #f1f5f9; margin: 0; letter-spacing: -0.01em; }
  .wf-group-desc { font-size: 11px; color: #64748b; margin: 2px 0 0; }

  .wf-steps { display: flex; flex-direction: column; gap: 6px; }
  .wf-step {
    background: rgba(30, 41, 59, 0.5);
    border: 1px solid rgba(51, 65, 85, 0.3);
    border-radius: 10px; transition: all 0.2s;
    overflow: hidden;
  }
  .wf-step:hover { background: rgba(30, 41, 59, 0.7); border-color: rgba(51, 65, 85, 0.5); }
  .wf-step.expanded {
    border-color: rgba(99, 102, 241, 0.3);
    box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.1);
  }

  .wf-step-row {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 14px; cursor: pointer;
  }
  .wf-step-icon {
    font-size: 20px; width: 36px; height: 36px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08));
    border-radius: 10px; border: 1px solid rgba(99,102,241,0.15);
  }
  .wf-step-body { flex: 1; min-width: 0; }
  .wf-step-label { font-size: 13px; font-weight: 700; color: #e2e8f0; }
  .wf-step-sub { font-size: 11px; color: #64748b; line-height: 1.4; margin-top: 2px; }
  .wf-step-chevron { color: #475569; font-size: 12px; flex-shrink: 0; transition: color 0.15s; }
  .wf-step:hover .wf-step-chevron { color: #94a3b8; }

  .wf-step-detail { padding: 0 14px 14px; border-top: 1px solid rgba(51, 65, 85, 0.3); }
  .wf-note-display {
    position: relative;
    background: rgba(15, 23, 42, 0.4); border: 1px solid rgba(51, 65, 85, 0.3);
    border-radius: 8px; padding: 14px; margin-top: 10px;
    cursor: pointer; transition: all 0.2s; min-height: 60px;
  }
  .wf-note-display:hover { border-color: rgba(99, 102, 241, 0.3); }
  .wf-note-display p { margin: 0 0 4px; font-size: 13px; color: #cbd5e1; line-height: 1.6; }
  .wf-note-empty {
    text-align: center; padding: 16px 12px; margin-top: 10px;
    background: rgba(15, 23, 42, 0.3); border: 1px dashed rgba(51, 65, 85, 0.4);
    border-radius: 8px; cursor: pointer; transition: all 0.2s;
  }
  .wf-note-empty:hover { border-color: rgba(99, 102, 241, 0.3); background: rgba(99, 102, 241, 0.04); }
  .wf-note-empty p { color: #475569; font-size: 12px; margin: 0; }
  .wf-note-editor { margin-top: 10px; }

  .pipeline-loop-note {
    margin-top: 16px; padding: 12px 16px;
    background: rgba(99, 102, 241, 0.06);
    border: 1px dashed rgba(99, 102, 241, 0.25);
    border-radius: 10px;
    font-size: 12px; color: #94a3b8; line-height: 1.6;
    display: flex; align-items: flex-start; gap: 8px;
  }
  .pipeline-loop-note span { font-size: 16px; flex-shrink: 0; }
`
