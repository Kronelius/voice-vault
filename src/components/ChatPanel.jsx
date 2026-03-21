import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { postApiStream } from '../lib/api'

export default function ChatPanel({ open, onClose }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [systemPrompt, setSystemPrompt] = useState('')
  const [profileName, setProfileName] = useState('')
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || streaming) return

    const userMessage = { role: 'user', content: input.trim() }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setStreaming(true)

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
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  if (!open) return null

  return (
    <div className="fixed bottom-20 right-5 z-50 flex flex-col shadow-2xl"
      style={{
        width: '400px',
        height: '520px',
        border: '3px solid var(--border-dark)',
        borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
        backgroundColor: 'var(--bg-surface)',
        overflow: 'hidden',
      }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b-[2px] border-dashed border-[var(--border)]"
        style={{ backgroundColor: 'var(--bg-surface)' }}>
        <div className="flex items-center gap-2">
          <span className="text-base">💬</span>
          <h3 className="text-sm font-heading font-bold text-[var(--text-primary)]">Chat</h3>
          {profileName && (
            <span className="text-[10px] font-mono text-[var(--accent)] bg-[var(--accent-muted)] px-1 py-0.5"
              style={{ border: '1px solid var(--accent)', borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
              {profileName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => { setMessages([]); setInput('') }}
            className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] font-sans px-1.5 py-0.5">
            Clear
          </button>
          <button onClick={onClose}
            className="text-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] leading-none px-1">
            ×
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-4">
              <p className="text-xs text-[var(--text-tertiary)] font-sans">
                Chat with Claude using your voice profile as context.
              </p>
              <p className="text-[10px] text-[var(--text-tertiary)] font-sans italic mt-1">
                Try: "Rewrite this at a 5th grade level"
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-3 py-2 text-xs leading-relaxed ${
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
              <div className="text-[10px] font-semibold text-[var(--text-tertiary)] mb-0.5 uppercase tracking-wide">
                {msg.role === 'user' ? 'You' : 'Claude'}
              </div>
              {msg.content || (streaming && i === messages.length - 1 ? '...' : '')}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-2 border-t-[2px] border-dashed border-[var(--border)]">
        <form onSubmit={handleSubmit} className="flex gap-1.5">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            disabled={streaming}
            className="sketch-input flex-1 px-2.5 py-1.5 text-xs font-sans resize-none"
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
