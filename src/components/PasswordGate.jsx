import { useState } from 'react'

const PASSCODE = '1234'

export default function PasswordGate({ children }) {
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem('vv_unlocked') === 'true'
  )
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (code === PASSCODE) {
      sessionStorage.setItem('vv_unlocked', 'true')
      setUnlocked(true)
    } else {
      setError(true)
      setCode('')
      setTimeout(() => setError(false), 1500)
    }
  }

  if (unlocked) return children

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <form
        onSubmit={handleSubmit}
        className="sketch-card p-8 w-80 text-center space-y-6"
      >
        <div>
          <h1
            className="text-2xl font-bold mb-1"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
          >
            Voice Vault
          </h1>
          <p
            className="text-sm"
            style={{ fontFamily: 'var(--font-body)', color: 'var(--text-tertiary)' }}
          >
            Enter access code to continue
          </p>
        </div>

        <input
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="••••"
          autoFocus
          className="clean-input w-full px-4 py-3 text-center text-lg tracking-widest"
          style={{ fontFamily: 'var(--font-mono)' }}
        />

        {error && (
          <p className="text-sm font-semibold" style={{ color: 'var(--error)' }}>
            Invalid code
          </p>
        )}

        <button
          type="submit"
          className="sketch-btn sketch-btn-primary w-full px-4 py-2.5 text-sm"
        >
          Unlock
        </button>
      </form>
    </div>
  )
}
