'use client'

import { useRouter, usePathname } from 'next/navigation'

export default function UnifiedTopBar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    document.cookie = 'vault_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    router.push('/login')
  }

  const isOnDashboard = pathname === '/'
  const isOnVault = pathname === '/vault' || pathname.startsWith('/vault')

  const navLinkStyle = (active: boolean): React.CSSProperties => ({
    fontSize: '13px',
    fontWeight: '500',
    color: active ? '#a78bfa' : '#64748b',
    textDecoration: 'none',
    padding: '4px 10px',
    borderRadius: '6px',
    background: active ? 'rgba(139,92,246,0.1)' : 'none',
    transition: 'all 0.15s',
    border: active ? '1px solid rgba(139,92,246,0.2)' : '1px solid transparent',
    cursor: 'pointer',
  })

  return (
    <div style={{
      height: '52px',
      background: '#111118',
      borderBottom: '1px solid #1e1e2a',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: '12px',
      flexShrink: 0,
      zIndex: 30,
    }}>
      {/* Logo + wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <div style={{
          width: '26px', height: '26px',
          background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
          borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, boxShadow: '0 0 12px rgba(139,92,246,0.25)',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
            <rect x="3" y="3" width="8" height="8" rx="1.5"/>
            <rect x="13" y="3" width="8" height="5" rx="1.5" opacity="0.7"/>
            <rect x="13" y="11" width="8" height="10" rx="1.5" opacity="0.9"/>
            <rect x="3" y="13" width="8" height="8" rx="1.5" opacity="0.6"/>
          </svg>
        </div>
        <span style={{
          fontSize: '15px', fontWeight: '600',
          background: 'linear-gradient(135deg, #e2e8f0, #94a3b8)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.01em',
        }}>
          OpsVault
        </span>
      </div>

      {/* Nav items */}
      <div style={{ display: 'flex', gap: '4px', marginLeft: '24px' }}>
        <a
          href="/"
          style={navLinkStyle(isOnDashboard)}
          onClick={(e) => {
            e.preventDefault()
            router.push('/')
          }}
        >
          Dashboard
        </a>
        <a
          href="/vault"
          style={navLinkStyle(isOnVault)}
          onClick={(e) => {
            e.preventDefault()
            router.push('/vault')
          }}
        >
          Wiki
        </a>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        style={{
          fontSize: '13px',
          fontWeight: '500',
          color: '#64748b',
          background: 'none',
          border: 'none',
          padding: '4px 10px',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#a78bfa'
          e.currentTarget.style.background = 'rgba(139,92,246,0.1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#64748b'
          e.currentTarget.style.background = 'none'
        }}
      >
        Sign Out
      </button>
    </div>
  )
}
