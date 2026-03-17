'use client'

import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

interface Props {
  user: User
  sidebarOpen: boolean
  onToggleSidebar: () => void
  onNewFile: () => void
  onNewFolder: () => void
}

export default function TopBar({ user, sidebarOpen, onToggleSidebar, onNewFile, onNewFolder }: Props) {
  const [showMenu, setShowMenu] = useState(false)
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const avatar = user.user_metadata?.avatar_url as string | undefined
  const name = (user.user_metadata?.full_name as string) || user.email || 'User'
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div style={{
      height: '52px',
      background: '#111118',
      borderBottom: '1px solid #1e1e2a',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: '12px',
      flexShrink: 0,
      zIndex: 10,
    }}>
      {/* Sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        title="Toggle sidebar"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '6px',
          borderRadius: '6px',
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#1c1c26')}
        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="9" y1="3" x2="9" y2="21"/>
        </svg>
      </button>

      {/* Wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '26px',
          height: '26px',
          background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 0 12px rgba(139,92,246,0.25)',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
            <rect x="3" y="3" width="8" height="8" rx="1.5"/>
            <rect x="13" y="3" width="8" height="5" rx="1.5" opacity="0.7"/>
            <rect x="13" y="11" width="8" height="10" rx="1.5" opacity="0.9"/>
            <rect x="3" y="13" width="8" height="8" rx="1.5" opacity="0.6"/>
          </svg>
        </div>
        <span style={{
          fontSize: '15px',
          fontWeight: '600',
          background: 'linear-gradient(135deg, #e2e8f0, #94a3b8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.01em',
        }}>
          OpsVault
        </span>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={onNewFile}
          style={{
            background: 'rgba(139,92,246,0.12)',
            border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: '7px',
            padding: '5px 11px',
            color: '#a78bfa',
            fontSize: '12px',
            fontWeight: '500',
            fontFamily: 'inherit',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(139,92,246,0.2)'
            e.currentTarget.style.borderColor = 'rgba(139,92,246,0.35)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(139,92,246,0.12)'
            e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)'
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New File
        </button>

        <button
          onClick={onNewFolder}
          style={{
            background: 'none',
            border: '1px solid #2a2a3a',
            borderRadius: '7px',
            padding: '5px 11px',
            color: '#64748b',
            fontSize: '12px',
            fontWeight: '500',
            fontFamily: 'inherit',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#1c1c26'
            e.currentTarget.style.color = '#94a3b8'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'none'
            e.currentTarget.style.color = '#64748b'
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            <line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>
          </svg>
          New Folder
        </button>

        {/* User avatar */}
        <div style={{ position: 'relative', marginLeft: '4px' }}>
          <button
            onClick={() => setShowMenu(p => !p)}
            style={{
              background: 'none',
              border: '1px solid #2a2a3a',
              borderRadius: '50%',
              cursor: 'pointer',
              padding: 0,
              width: '30px',
              height: '30px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#4a4a5e'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#2a2a3a'}
          >
            {avatar ? (
              <img src={avatar} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '600' }}>{initials}</span>
            )}
          </button>

          {showMenu && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              background: '#1c1c26',
              border: '1px solid #2a2a3a',
              borderRadius: '10px',
              minWidth: '200px',
              boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
              zIndex: 100,
              overflow: 'hidden',
            }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid #2a2a3a' }}>
                <div style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: '500', marginBottom: '2px' }}>
                  {name}
                </div>
                <div style={{ color: '#64748b', fontSize: '12px' }}>{user.email}</div>
              </div>
              <button
                onClick={handleSignOut}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  padding: '10px 14px',
                  color: '#94a3b8',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#22222e'
                  e.currentTarget.style.color = '#e2e8f0'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'none'
                  e.currentTarget.style.color = '#94a3b8'
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16,17 21,12 16,7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
