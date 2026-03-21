import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { postApiStream } from '../lib/api'
import Spinner from '../components/ui/Spinner'

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [systemPrompt, setSystemPrompt] = useState('')
  const [profileName, setProfileName] = useState('')
  const [showSystem, setShowSystem] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Load voice profile system prompt
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
      setLoading(false)
    }
    loadProfile()
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || streaming) return

    const userMessage = { role: 'user', content: input.trim() }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setStreaming(true)

    // Add empty assistant message for streaming
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const apiMessages = updatedMessages.map(m => ({ role: m.role, content: m.content }))
      await postApiStream('/api/chat', { messages: apiMessages, systemPrompt }, (chunk) => {
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: updated[updated.length - 1].content + chunk,
          }
          return updated
        })
      })
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: `Error: ${err.message}`,
          isError: true,
        }
        return updated
      })
    }

    setStreaming(false)
    inputRef.current?.focus()
  }

  const handleClear = () => {
    setMessages([])
    setInput('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 shrink-0">
        <h2 className="text-xl font-heading font-bold text-[var(--text-primary)]">Chat</h2>
        {profileName && (
          <span className="text-xs font-mono text-[var(--accent)] bg-[var(--accent-muted)] px-1.5 py-0.5"
            style={{ border: '1.5px solid var(--accent)', borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
            {profileName}
          </span>
        )}
        <div className="flex-1" />
        <button onClick={() => setShowSystem(!showSystem)}
          className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] font-sans">
          {showSystem ? 'Hide' : 'Show'} System Prompt
        </button>
        <button onClick={handleClear}
          className="sketch-btn sketch-btn-outline px-3 py-1.5 text-xs">
          Clear Chat
        </button>
      </div>

      {/* System prompt (collapsible) */}
      {showSystem && (
        <div className="sketch-card p-3 mb-3 shrink-0" style={{ backgroundColor: 'var(--note-purple)' }}>
          <label className="block text-xs text-[var(--text-tertiary)] mb-1 font-sans font-semibold">System Prompt</label>
          <textarea
            value={systemPrompt}
            onChange={e => setSystemPrompt(e.target.value)}
            rows={4}
            className="sketch-input w-full px-3 py-2 text-xs font-mono"
            placeholder="System prompt loaded from your active voice profile..."
          />
          <p className="text-xs text-[var(--text-tertiary)] mt-1 font-sans italic">
            Loaded from your active voice profile. Edit here to override for this session.
          </p>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pb-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <p className="text-sm text-[var(--text-tertiary)] font-sans">
                Chat with Claude using your voice profile as context.
              </p>
              <p className="text-xs text-[var(--text-tertiary)] font-sans italic">
                Try: "Rewrite this paragraph at a 5th grade level" or "What signature moves am I using here?"
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'sketch-card font-sans text-[var(--text-primary)]'
                  : msg.isError
                    ? 'sketch-card font-sans text-[var(--error)]'
                    : 'clean-card font-sans text-[var(--text-primary)]'
              }`}
              style={{
                backgroundColor: msg.role === 'user' ? 'var(--note-orange)' : msg.isError ? 'var(--note-pink)' : 'var(--bg-card)',
                whiteSpace: 'pre-wrap',
              }}
            >
              <div className="text-xs font-semibold text-[var(--text-tertiary)] mb-1 uppercase tracking-wide">
                {msg.role === 'user' ? 'You' : 'Claude'}
              </div>
              {msg.content || (streaming && i === messages.length - 1 ? '...' : '')}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 pt-2 border-t-[2px] border-dashed border-[var(--border)]">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send, Shift+Enter for newline)"
            rows={2}
            disabled={streaming}
            className="sketch-input flex-1 px-3 py-2 text-sm font-sans resize-none"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className="sketch-btn sketch-btn-primary px-4 py-2 text-sm self-end"
          >
            {streaming ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  )
}
