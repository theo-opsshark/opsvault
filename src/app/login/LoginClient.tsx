'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginClient() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(false)

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push('/')
      router.refresh()
    } else {
      setError(true)
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f0f13',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', -apple-system, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Card */}
      <div style={{
        background: '#16161e',
        border: '1px solid #2a2a3a',
        borderRadius: '16px',
        padding: '48px 44px',
        width: '100%',
        maxWidth: '420px',
        position: 'relative',
        zIndex: 1,
        boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '20px',
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(139,92,246,0.3)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="8" height="8" rx="1.5" fill="white" opacity="0.9"/>
                <rect x="13" y="3" width="8" height="5" rx="1.5" fill="white" opacity="0.6"/>
                <rect x="13" y="11" width="8" height="10" rx="1.5" fill="white" opacity="0.8"/>
                <rect x="3" y="13" width="8" height="8" rx="1.5" fill="white" opacity="0.5"/>
              </svg>
            </div>
            <span style={{
              fontSize: '22px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #e2e8f0, #94a3b8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}>
              OpsVault
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>
            Enter your password to continue.
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            style={{
              width: '100%',
              padding: '13px 16px',
              background: '#1a1a24',
              border: error ? '1px solid rgba(239,68,68,0.5)' : '1px solid #2a2a3a',
              borderRadius: '10px',
              color: '#e2e8f0',
              fontSize: '14px',
              fontFamily: 'inherit',
              outline: 'none',
              marginBottom: '12px',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
          />

          {error && (
            <p style={{ color: '#fca5a5', fontSize: '13px', marginBottom: '12px', textAlign: 'center' }}>
              Incorrect password. Try again.
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: '100%',
              padding: '13px 20px',
              background: loading || !password ? '#2a2a3a' : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              border: 'none',
              borderRadius: '10px',
              color: loading || !password ? '#64748b' : 'white',
              fontSize: '14px',
              fontWeight: '600',
              fontFamily: 'inherit',
              cursor: loading || !password ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
              boxShadow: loading || !password ? 'none' : '0 4px 20px rgba(139,92,246,0.3)',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
