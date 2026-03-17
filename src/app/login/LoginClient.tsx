'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function LoginClient() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const [loading, setLoading] = useState(false)

  const errorMessages: Record<string, string> = {
    unauthorized_domain: 'Access restricted to @opsshark.com accounts.',
    auth_failed: 'Authentication failed. Please try again.',
    no_code: 'Login incomplete. Please try again.',
  }

  async function handleGoogleSignIn() {
    setLoading(true)
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          hd: 'opsshark.com', // hint Google to show opsshark accounts
        },
      },
    })
    if (error) {
      console.error(error)
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
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '20%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(ellipse, rgba(99,102,241,0.05) 0%, transparent 70%)',
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
                <path d="M19 11H7.83l4.88-4.88c.39-.39.39-1.03 0-1.42-.39-.39-1.02-.39-1.41 0l-6.59 6.59c-.39.39-.39 1.02 0 1.41l6.59 6.59c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L7.83 13H19c.55 0 1-.45 1-1s-.45-1-1-1z" fill="white" style={{transform: 'rotate(180deg)', transformOrigin: 'center'}}/>
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

          <p style={{
            color: '#64748b',
            fontSize: '14px',
            lineHeight: '1.5',
          }}>
            Shared knowledge base for the ops team.
            <br />
            Sign in with your OpsShark account.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '8px',
            padding: '12px 14px',
            marginBottom: '20px',
            color: '#fca5a5',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{flexShrink: 0}}>
              <circle cx="12" cy="12" r="10" stroke="#fca5a5" strokeWidth="2"/>
              <line x1="12" y1="8" x2="12" y2="12" stroke="#fca5a5" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="16" r="1" fill="#fca5a5"/>
            </svg>
            {errorMessages[error] ?? 'Something went wrong. Please try again.'}
          </div>
        )}

        {/* Sign in button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            width: '100%',
            padding: '13px 20px',
            background: loading ? '#1c1c26' : '#1e1e2e',
            border: '1px solid #2a2a3a',
            borderRadius: '10px',
            color: loading ? '#64748b' : '#e2e8f0',
            fontSize: '14px',
            fontWeight: '500',
            fontFamily: 'inherit',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'all 0.15s',
            position: 'relative',
          }}
          onMouseEnter={e => {
            if (!loading) {
              (e.target as HTMLButtonElement).style.background = '#22222e'
              ;(e.target as HTMLButtonElement).style.borderColor = '#3a3a4e'
            }
          }}
          onMouseLeave={e => {
            if (!loading) {
              (e.target as HTMLButtonElement).style.background = '#1e1e2e'
              ;(e.target as HTMLButtonElement).style.borderColor = '#2a2a3a'
            }
          }}
        >
          {loading ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{animation: 'spin 1s linear infinite'}}>
                <circle cx="12" cy="12" r="10" stroke="#64748b" strokeWidth="2" strokeDasharray="31.416" strokeDashoffset="10"/>
              </svg>
              Signing in...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </>
          )}
        </button>

        {/* Footer note */}
        <p style={{
          marginTop: '24px',
          textAlign: 'center',
          color: '#374151',
          fontSize: '12px',
        }}>
          Access restricted to @opsshark.com accounts
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
