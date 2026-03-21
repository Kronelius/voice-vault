import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { postApi, postApiStream } from '../lib/api'

const QUICK_ACTIONS = [
  { id: 'review', label: '📋 Request Review', description: 'AI voice analysis of your edits', needsContent: true },
  { id: 'headlines', label: '✏️ Suggest Headlines', description: '5 alternative title ideas', needsContent: true },
  { id: 'strengthen', label: '💪 Strengthen Opening', description: 'Rewrite the intro to hook harder', needsContent: true },
  { id: 'grade', label: '📊 Adjust Grade', description: 'Rewrite to a target reading level', needsContent: true, needsInput: true, inputLabel: 'Target grade:', inputPlaceholder: '8' },
]

export default function ChatPanel({ open, onClose, contentId }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [systemPrompt, setSystemPrompt] = useState('')
  const [profileName, setProfileName] = useState('')
  const [contentTitle, setContentTitle] = useState('')
  const [actionInput, setActionInput] = useState('')
  const [activeAction, setActiveAction] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    async function loadProfile() {
      const { data: profile } = await supabase
        .from('voice_profiles')
        .select('name, system_prompt')
        .eq('is_active', true)
        .limit(1)
        .single()
      if (profile) {
        setSystemPrompt(profile.system_prompt || '')
        setProfileName(profile.name || 'Voice Profile')
      }
    }
    loadProfile()
  }, [])

  // Load content title when contentId changes
  useEffect(() => {
    if (!contentId) {
      setContentTitle('')
      return
    }
    async function loadTitle() {
      const { data } = await supabase
        .from('generated_content')
        .select('title')
        .eq('id', contentId)
        .single()
      setContentTitle(data?.title || '')
    }
    loadTitle()
  }, [contentId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const addMessage = (role, content, extra = {}) => {
    setMessages(prev => [...prev, { role, content, ...extra }])
  }

  const updateLastMessage = (updater) => {
    setMessages(prev => {
      const updated = [...prev]
      const last = updated[updated.length - 1]
      updated[updated.length - 1] = typeof updater === 'function' ? updater(last) : { ...last, ...updater }
      return updated
    })
  }

  // Apply rewritten content back to lab_markdown in Supabase
  const handleApplyToLab = async (markdown) => {
    if (!contentId) return
    const { error } = await supabase
      .from('generated_content')
      .update({ lab_markdown: markdown })
      .eq('id', contentId)
    if (error) {
      addMessage('system', `Failed to apply: ${error.message}`, { isError: true })
    } else {
      addMessage('system', '✅ Applied to lab. Refresh the editor to see changes.', { isSuccess: true })
    }
  }

  // Quick action handlers
  const handleQuickAction = async (action) => {
    if (streaming || activeAction) return
    if (!contentId) {
      addMessage('system', 'Navigate to a content piece first to use quick actions.', { isError: true })
      return
    }

    setActiveAction(action.id)
    setStreaming(true)

    try {
      switch (action.id) {
        case 'review': {
          addMessage('user', '📋 Request Review', { isAction: true })
          addMessage('assistant', 'Analyzing your edits against your voice profile...', { isLoading: true })

          // Set lab_status to pending_review first
          await supabase.from('generated_content')
            .update({ lab_status: 'pending_review' })
            .eq('id', contentId)

          const result = await postApi('/api/review', { contentId })
          updateLastMessage({ content: result.notes, isLoading: false })
          break
        }

        case 'headlines': {
          addMessage('user', '✏️ Suggest Headlines', { isAction: true })
          addMessage('assistant', 'Generating headline alternatives...', { isLoading: true })
          const result = await postApi('/api/suggest-headlines', { contentId })
          const formatted = (result.headlines || []).map((h, i) => `${i + 1}. ${h}`).join('\n')
          updateLastMessage({ content: formatted, isLoading: false })
          break
        }

        case 'strengthen': {
          addMessage('user', '💪 Strengthen Opening', { isAction: true })
          addMessage('assistant', '', { isLoading: true, isRewrite: true })
          let fullText = ''
          await postApiStream('/api/strengthen-opening', { contentId }, (chunk) => {
            fullText += chunk
            updateLastMessage({ content: fullText, isLoading: false })
          })
          updateLastMessage({ content: fullText, isLoading: false, isRewrite: true })
          break
        }

        case 'grade': {
          const grade = actionInput.trim()
          if (!grade || isNaN(grade)) {
            addMessage('system', 'Enter a valid grade number first.', { isError: true })
            break
          }
          addMessage('user', `📊 Adjust to Grade ${grade}`, { isAction: true })
          addMessage('assistant', '', { isLoading: true, isRewrite: true })
          let gradeText = ''
          await postApiStream('/api/adjust-grade', { contentId, targetGrade: Number(grade) }, (chunk) => {
            gradeText += chunk
            updateLastMessage({ content: gradeText, isLoading: false })
          })
          updateLastMessage({ content: gradeText, isLoading: false, isRewrite: true })
          setActionInput('')
          break
        }
      }
    } catch (err) {
      updateLastMessage({ content: `Error: ${err.message}`, isLoading: false, isError: true })
    }

    setStreaming(false)
    setActiveAction(null)
  }

  // Freeform chat — now content-aware
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || streaming) return

    const userMessage = { role: 'user', content: input.trim() }
    const updatedMessages = [...messages.filter(m => m.role === 'user' || m.role === 'assistant'), userMessage]
    addMessage('user', input.trim())
    setInput('')
    setStreaming(true)

    addMessage('assistant', '', {})

    try {
      const apiMessages = updatedMessages.map(m => ({ role: m.role, content: m.content }))
      let fullResponse = ''
      await postApiStream('/api/chat', {
        messages: apiMessages,
        systemPrompt,
        contentId: contentId || undefined,
      }, (chunk) => {
        fullResponse += chunk
        updateLastMessage({ content: fullResponse })
      })
      // Check if response looks like markdown content (rewrite) — mark for Apply to Lab
      const looksLikeRewrite = fullResponse.includes('# ') || fullResponse.length > 500
      if (looksLikeRewrite && contentId) {
        updateLastMessage({ content: fullResponse, isRewrite: true })
      }
    } catch (err) {
      updateLastMessage({ content: `Error: ${err.message}`, isError: true })
    }

    setStreaming(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  if (!open) return null

  const hasContent = !!contentId

  return (
    <div className="fixed bottom-20 right-5 z-50 flex flex-col shadow-2xl"
      style={{
        width: '420px',
        height: '580px',
        border: '3px solid var(--border-dark)',
        borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
        backgroundColor: 'var(--bg-surface)',
        overflow: 'hidden',
      }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b-[2px] border-dashed border-[var(--border)]"
        style={{ backgroundColor: 'var(--bg-surface)' }}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base shrink-0">💬</span>
          <h3 className="text-sm font-heading font-bold text-[var(--text-primary)] shrink-0">Chat</h3>
          {profileName && (
            <span className="text-[10px] font-mono text-[var(--accent)] bg-[var(--accent-muted)] px-1 py-0.5 truncate"
              style={{ border: '1px solid var(--accent)', borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
              {profileName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => { setMessages([]); setInput(''); setActionInput('') }}
            className="text-[11px] font-sans font-semibold px-2.5 py-1 transition-all duration-150"
            style={{
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-secondary)',
              border: '2px solid var(--border-dark)',
              borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
              cursor: 'pointer',
            }}
            onMouseEnter={e => { e.target.style.backgroundColor = 'var(--note-yellow)'; e.target.style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { e.target.style.backgroundColor = 'var(--bg-card)'; e.target.style.color = 'var(--text-secondary)' }}
          >
            Clear
          </button>
          <button onClick={onClose}
            className="text-sm font-bold px-2 py-0.5 transition-all duration-150"
            style={{
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-secondary)',
              border: '2px solid var(--border-dark)',
              borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
              cursor: 'pointer',
            }}
            onMouseEnter={e => { e.target.style.backgroundColor = 'var(--note-pink)'; e.target.style.color = 'var(--error)' }}
            onMouseLeave={e => { e.target.style.backgroundColor = 'var(--bg-card)'; e.target.style.color = 'var(--text-secondary)' }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content context indicator */}
      {hasContent && contentTitle && (
        <div className="px-3 py-1.5 border-b border-[var(--border)]" style={{ backgroundColor: 'var(--note-green)' }}>
          <p className="text-[10px] font-sans text-[var(--text-secondary)] truncate">
            <span className="font-semibold">Working on:</span> {contentTitle}
          </p>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
        {/* Empty state with quick actions */}
        {messages.length === 0 && (
          <div className="space-y-3 py-2">
            {hasContent ? (
              <>
                <p className="text-[11px] text-[var(--text-tertiary)] font-sans text-center mb-2">
                  Quick actions for your draft:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_ACTIONS.map(action => (
                    <div key={action.id}>
                      <button
                        onClick={() => action.needsInput ? null : handleQuickAction(action)}
                        disabled={streaming}
                        className="w-full text-left px-2.5 py-2 transition-all duration-150"
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          border: '2px solid var(--border)',
                          borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
                          cursor: action.needsInput ? 'default' : 'pointer',
                        }}
                        onMouseEnter={e => { if (!action.needsInput) e.currentTarget.style.backgroundColor = 'var(--note-orange)' }}
                        onMouseLeave={e => { if (!action.needsInput) e.currentTarget.style.backgroundColor = 'var(--bg-card)' }}
                      >
                        <div className="text-xs font-semibold text-[var(--text-primary)] font-sans">{action.label}</div>
                        <div className="text-[10px] text-[var(--text-tertiary)] font-sans mt-0.5">{action.description}</div>
                      </button>
                      {action.needsInput && (
                        <div className="flex gap-1 mt-1">
                          <input
                            type="number"
                            value={actionInput}
                            onChange={e => setActionInput(e.target.value)}
                            placeholder={action.inputPlaceholder}
                            className="sketch-input flex-1 px-2 py-1 text-xs font-mono"
                            style={{ width: '60px' }}
                          />
                          <button
                            onClick={() => handleQuickAction(action)}
                            disabled={streaming || !actionInput.trim()}
                            className="sketch-btn sketch-btn-primary px-2 py-1 text-[10px]"
                          >
                            Go
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-[var(--text-tertiary)] font-sans text-center italic mt-2">
                  Or type a custom request below
                </p>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center px-4">
                  <p className="text-xs text-[var(--text-tertiary)] font-sans">
                    Chat with Claude using your voice profile.
                  </p>
                  <p className="text-[10px] text-[var(--text-tertiary)] font-sans italic mt-2">
                    Navigate to a content piece for quick actions.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((msg, i) => (
          <div key={i}>
            <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[90%] px-3 py-2 text-xs leading-relaxed font-sans ${
                  msg.role === 'system'
                    ? ''
                    : msg.role === 'user'
                      ? 'sketch-card text-[var(--text-primary)]'
                      : msg.isError
                        ? 'sketch-card text-[var(--error)]'
                        : 'clean-card text-[var(--text-primary)]'
                }`}
                style={{
                  backgroundColor:
                    msg.role === 'system' ? (msg.isSuccess ? 'var(--note-green)' : msg.isError ? 'var(--note-pink)' : 'var(--bg-card)')
                    : msg.role === 'user' ? 'var(--note-orange)'
                    : msg.isError ? 'var(--note-pink)'
                    : 'var(--bg-card)',
                  whiteSpace: 'pre-wrap',
                  border: msg.role === 'system' ? '1px dashed var(--border)' : undefined,
                  borderRadius: msg.role === 'system' ? '8px' : undefined,
                  padding: msg.role === 'system' ? '6px 10px' : undefined,
                  width: msg.role === 'system' ? '100%' : undefined,
                  textAlign: msg.role === 'system' ? 'center' : undefined,
                  fontSize: msg.role === 'system' ? '10px' : undefined,
                }}
              >
                {msg.role !== 'system' && (
                  <div className="text-[10px] font-semibold text-[var(--text-tertiary)] mb-0.5 uppercase tracking-wide">
                    {msg.role === 'user' ? (msg.isAction ? 'Action' : 'You') : 'Claude'}
                  </div>
                )}
                {msg.isLoading ? (
                  <span className="text-[var(--text-tertiary)] italic">
                    {msg.content || 'Thinking...'}
                  </span>
                ) : (
                  msg.content || (streaming && i === messages.length - 1 ? '...' : '')
                )}
              </div>
            </div>

            {/* Apply to Lab button for rewrites */}
            {msg.role === 'assistant' && msg.isRewrite && msg.content && !msg.isLoading && contentId && (
              <div className="flex justify-start mt-1 ml-1">
                <button
                  onClick={() => handleApplyToLab(msg.content)}
                  className="text-[10px] font-sans font-semibold px-3 py-1 transition-all duration-150"
                  style={{
                    backgroundColor: 'var(--note-green)',
                    color: '#5A8A4A',
                    border: '2px solid #5A8A4A',
                    borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => { e.target.style.backgroundColor = '#5A8A4A'; e.target.style.color = '#fff' }}
                  onMouseLeave={e => { e.target.style.backgroundColor = 'var(--note-green)'; e.target.style.color = '#5A8A4A' }}
                >
                  ✅ Apply to Lab
                </button>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick action bar (when messages exist and content is active) */}
      {messages.length > 0 && hasContent && (
        <div className="px-3 py-1.5 border-t border-[var(--border)] flex gap-1.5 overflow-x-auto">
          {QUICK_ACTIONS.filter(a => !a.needsInput).map(action => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action)}
              disabled={streaming}
              className="text-[10px] font-sans font-semibold px-2 py-1 whitespace-nowrap shrink-0 transition-all duration-150"
              style={{
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                border: '1.5px solid var(--border)',
                borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
                cursor: 'pointer',
                opacity: streaming ? 0.5 : 1,
              }}
              onMouseEnter={e => { e.target.style.backgroundColor = 'var(--note-orange)' }}
              onMouseLeave={e => { e.target.style.backgroundColor = 'var(--bg-card)' }}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-3 py-2 border-t-[2px] border-dashed border-[var(--border)]">
        <form onSubmit={handleSubmit} className="flex gap-1.5">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={hasContent ? "Ask about your draft..." : "Type a message..."}
            rows={3}
            disabled={streaming}
            className="sketch-input flex-1 px-2.5 py-2 text-sm font-sans resize-none"
            style={{ minHeight: '72px' }}
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className="sketch-btn sketch-btn-primary px-3 py-1.5 text-xs self-end"
          >
            {streaming ? '...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  )
}
