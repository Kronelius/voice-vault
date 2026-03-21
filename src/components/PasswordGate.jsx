import { useState, useEffect } from 'react'

const PASSCODE = '1234'
const PIN_LENGTH = 4

export default function PasswordGate({ children }) {
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem('vv_unlocked') === 'true'
  )
  const [digits, setDigits] = useState([])
  const [error, setError] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [welcomePhase, setWelcomePhase] = useState('idle') // idle | jump-in | visible | jump-out

  useEffect(() => {
    if (digits.length === PIN_LENGTH) {
      const entered = digits.join('')
      if (entered === PASSCODE) {
        setSuccess(true)
        // Start welcome sequence after brief PIN success flash
        setTimeout(() => {
          setShowWelcome(true)
          // Phase 1: jump in
          requestAnimationFrame(() => setWelcomePhase('jump-in'))
          // Phase 2: hold visible
          setTimeout(() => setWelcomePhase('visible'), 400)
          // Phase 3: jump out
          setTimeout(() => setWelcomePhase('jump-out'), 1800)
          // Phase 4: unlock and show app
          setTimeout(() => {
            sessionStorage.setItem('vv_unlocked', 'true')
            setUnlocked(true)
          }, 2200)
        }, 300)
      } else {
        setError(true)
        setTimeout(() => {
          setError(false)
          setDigits([])
        }, 800)
      }
    }
  }, [digits])

  // Keyboard support
  useEffect(() => {
    if (unlocked) return
    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key)
      } else if (e.key === 'Backspace') {
        handleDelete()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [unlocked, digits])

  const handleDigit = (num) => {
    if (digits.length >= PIN_LENGTH || error || success) return
    setDigits(prev => [...prev, num])
  }

  const handleDelete = () => {
    if (error || success) return
    setDigits(prev => prev.slice(0, -1))
  }

  if (unlocked) return children

  // Welcome splash screen
  if (showWelcome) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div
          style={{
            textAlign: 'center',
            transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform:
              welcomePhase === 'idle' ? 'scale(0) translateY(40px)' :
              welcomePhase === 'jump-in' ? 'scale(1.1) translateY(-10px)' :
              welcomePhase === 'visible' ? 'scale(1) translateY(0)' :
              'scale(0) translateY(-60px)',
            opacity: welcomePhase === 'idle' || welcomePhase === 'jump-out' ? 0 : 1,
          }}
        >
          <h1
            className="text-5xl font-bold mb-2"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent)' }}
          >
            Welcome
          </h1>
          <p
            className="text-lg"
            style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}
          >
            to Voice Vault
          </p>
        </div>
      </div>
    )
  }

  const numpadRows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    [null, '0', 'del'],
  ]

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="text-center" style={{ width: '300px' }}>
        {/* Title */}
        <h1
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
        >
          Voice Vault
        </h1>
        <p
          className="text-sm mb-8"
          style={{ fontFamily: 'var(--font-body)', color: 'var(--text-tertiary)' }}
        >
          Enter access code
        </p>

        {/* PIN Boxes */}
        <div className="flex justify-center gap-4 mb-3">
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-center transition-all duration-150"
              style={{
                width: '56px',
                height: '68px',
                fontSize: '28px',
                fontFamily: 'var(--font-mono)',
                fontWeight: '700',
                color: 'var(--text-primary)',
                backgroundColor: digits[i] != null ? 'var(--note-orange)' : 'var(--bg-card)',
                border: `3px solid ${
                  error ? 'var(--error)'
                  : success ? '#5A8A4A'
                  : digits[i] != null ? 'var(--accent)'
                  : 'var(--border-dark)'
                }`,
                borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
                transform: error ? `translateX(${i % 2 === 0 ? '-4' : '4'}px)` : 'none',
              }}
            >
              {digits[i] != null ? digits[i] : ''}
            </div>
          ))}
        </div>

        {/* Error message */}
        <div className="h-6 mb-4">
          {error && (
            <p className="text-sm font-semibold" style={{ color: 'var(--error)', fontFamily: 'var(--font-body)' }}>
              Invalid code
            </p>
          )}
        </div>

        {/* Number Pad */}
        <div className="space-y-3">
          {numpadRows.map((row, ri) => (
            <div key={ri} className="flex justify-center gap-3">
              {row.map((key, ki) => {
                if (key === null) {
                  return <div key={ki} style={{ width: '72px', height: '56px' }} />
                }
                if (key === 'del') {
                  return (
                    <button
                      key={ki}
                      onClick={handleDelete}
                      className="flex items-center justify-center transition-all duration-150"
                      style={{
                        width: '72px',
                        height: '56px',
                        fontSize: '16px',
                        fontFamily: 'var(--font-body)',
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      ⌫
                    </button>
                  )
                }
                return (
                  <button
                    key={ki}
                    onClick={() => handleDigit(key)}
                    className="flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95"
                    style={{
                      width: '72px',
                      height: '56px',
                      fontSize: '24px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: '700',
                      color: 'var(--text-primary)',
                      backgroundColor: 'var(--bg-card)',
                      border: '2px solid var(--border-dark)',
                      borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
                      cursor: 'pointer',
                    }}
                  >
                    {key}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
