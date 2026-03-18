'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import type { Folder, VaultFile } from '@/lib/supabase'
import Link from 'next/link'

interface Props {
  user: User | null
  folders: Folder[]
  files: VaultFile[]
  activeFileId: string | null
  sidebarOpen: boolean
  isMobile: boolean
  sidebarWidth: number
  onToggleSidebar: () => void
  onSidebarWidthChange: (width: number) => void
  onSelectFile: (id: string) => void
}

export default function AppNav({
  user,
  folders,
  files,
  activeFileId,
  sidebarOpen,
  isMobile,
  sidebarWidth,
  onToggleSidebar,
  onSidebarWidthChange,
  onSelectFile,
}: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('opsvault-expanded-folders')
      if (saved) return new Set(JSON.parse(saved))
    }
    return new Set()
  })
  const resizeRef = useRef<HTMLDivElement>(null)
  const isResizing = useRef(false)

  // Persist expanded folders to localStorage
  useEffect(() => {
    localStorage.setItem('opsvault-expanded-folders', JSON.stringify(Array.from(expandedFolders)))
  }, [expandedFolders])

  // Persist sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('opsvault-sidebar-open', JSON.stringify(sidebarOpen))
  }, [sidebarOpen])

  // Handle resize
  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!isResizing.current) return
      const newWidth = e.clientX
      if (newWidth >= 180 && newWidth <= 480) {
        onSidebarWidthChange(newWidth)
      }
    }

    function handleMouseUp() {
      isResizing.current = false
      document.body.style.userSelect = 'auto'
    }

    if (isResizing.current) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [onSidebarWidthChange])

  function handleResizeStart() {
    isResizing.current = true
    document.body.style.userSelect = 'none'
  }

  function toggleFolder(folderId: string) {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }

  async function handleSignOut() {
    document.cookie = 'vault_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    router.push('/login')
  }

  // Build folder tree for wiki
  function getFolderChildren(parentId: string | null): (Folder | VaultFile)[] {
    const childFolders = folders.filter(f => f.parent_id === parentId)
    const childFiles = files.filter(f => f.folder_id === parentId)
    return [...childFolders, ...childFiles]
  }

  // Render folder tree recursively
  function renderFolderTree(parentId: string | null, depth: number): React.ReactNode {
    const children = getFolderChildren(parentId)
    if (children.length === 0) return null

    return children.map(item => {
      if ('parent_id' in item) {
        // It's a folder
        const isExpanded = expandedFolders.has(item.id)
        const hasChildren = getFolderChildren(item.id).length > 0
        return (
          <div key={`folder-${item.id}`}>
            <button
              onClick={() => toggleFolder(item.id)}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                padding: `6px ${8 + depth * 12}px`,
                textAlign: 'left',
                color: '#94a3b8',
                fontSize: '13px',
                fontFamily: 'inherit',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#1c1c26'
                e.currentTarget.style.color = '#e2e8f0'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'none'
                e.currentTarget.style.color = '#94a3b8'
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                style={{
                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.15s',
                  flexShrink: 0,
                }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                style={{ flexShrink: 0, opacity: 0.7 }}
              >
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {item.name}
              </span>
            </button>
            {isExpanded && hasChildren && renderFolderTree(item.id, depth + 1)}
          </div>
        )
      } else {
        // It's a file
        const isActive = activeFileId === item.id
        return (
          <button
            key={`file-${item.id}`}
            onClick={() => {
              onSelectFile(item.id)
              if (isMobile) onToggleSidebar()
            }}
            style={{
              width: '100%',
              background: isActive ? 'linear-gradient(90deg, rgba(99,102,241,0.18), rgba(139,92,246,0.1))' : 'none',
              border: 'none',
              borderRadius: '6px',
              padding: `6px ${8 + (depth + 1) * 12}px`,
              minHeight: '36px',
              color: isActive ? '#c4b5fd' : '#94a3b8',
              fontSize: '13px',
              fontFamily: 'inherit',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.12s',
              borderLeft: isActive ? '2px solid #8b5cf6' : '2px solid transparent',
              margin: '0 4px',
            }}
            onMouseEnter={e => {
              if (!isActive) e.currentTarget.style.background = '#1c1c26'
            }}
            onMouseLeave={e => {
              if (!isActive) e.currentTarget.style.background = 'none'
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              style={{ flexShrink: 0, opacity: 0.7 }}
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {item.name.replace(/\.md$/, '')}
            </span>
          </button>
        )
      }
    })
  }

  const avatar = user?.user_metadata?.avatar_url as string | undefined
  const name = (user?.user_metadata?.full_name as string) || user?.email || 'Travis'
  const initials = name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const isWikiActive = pathname === '/vault' || pathname.startsWith('/vault/')
  const isDashboardActive = pathname === '/'

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && isMobile && (
        <div
          onClick={onToggleSidebar}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 19,
          }}
        />
      )}

      {/* Sidebar */}
      <div
        style={{
          position: isMobile ? 'fixed' : 'relative',
          left: 0,
          top: 0,
          width: sidebarOpen ? `${sidebarWidth}px` : '0px',
          height: '100vh',
          background: '#0f0f13',
          borderRight: sidebarOpen ? '1px solid #1e1e2a' : 'none',
          display: 'flex',
          flexDirection: 'column',
          transition: isMobile ? 'width 0.3s ease-out' : 'width 0.15s ease-out',
          zIndex: isMobile ? 20 : 'auto',
          overflow: sidebarOpen ? 'auto' : 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* Logo section */}
        {sidebarOpen && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '16px',
              borderBottom: '1px solid #1e1e2a',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 0 12px rgba(139,92,246,0.25)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <rect x="3" y="3" width="8" height="8" rx="1.5" />
                <rect x="13" y="3" width="8" height="5" rx="1.5" opacity="0.7" />
                <rect x="13" y="11" width="8" height="10" rx="1.5" opacity="0.9" />
                <rect x="3" y="13" width="8" height="8" rx="1.5" opacity="0.6" />
              </svg>
            </div>
            <Link
              href="/vault"
              style={{
                fontSize: '15px',
                fontWeight: '600',
                background: 'linear-gradient(135deg, #e2e8f0, #94a3b8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.01em',
                textDecoration: 'none',
              }}
            >
              OpsVault
            </Link>
          </div>
        )}

        {/* Navigation items */}
        {sidebarOpen && (
          <div style={{ flex: 1, overflow: 'auto', padding: '8px 4px' }}>
            {/* Dashboard link */}
            <Link
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                margin: '0 4px',
                borderRadius: '6px',
                background: isDashboardActive ? 'rgba(139,92,246,0.12)' : 'none',
                border: isDashboardActive ? '1px solid rgba(139,92,246,0.2)' : '1px solid transparent',
                color: isDashboardActive ? '#a78bfa' : '#94a3b8',
                fontSize: '13px',
                fontWeight: '500',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
                minHeight: '36px',
              }}
              onClick={() => {
                if (isMobile) onToggleSidebar()
              }}
              onMouseEnter={e => {
                if (!isDashboardActive) {
                  e.currentTarget.style.background = '#1c1c26'
                  e.currentTarget.style.color = '#e2e8f0'
                }
              }}
              onMouseLeave={e => {
                if (!isDashboardActive) {
                  e.currentTarget.style.background = 'none'
                  e.currentTarget.style.color = '#94a3b8'
                }
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                style={{ flexShrink: 0 }}
              >
                <polyline points="12 3 20 7.5 20 16.5 12 21 4 16.5 4 7.5 12 3" />
                <polyline points="12 12.5 20 9.5 20 16.5 12 19.5 4 16.5 4 9.5 12 12.5" />
              </svg>
              <span>Dashboard</span>
            </Link>

            {/* Wiki section with folder tree */}
            <div style={{ marginTop: '8px' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#4a4a6a',
                  padding: '8px 12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                  margin: '4px 0 4px 0',
                }}
              >
                Wiki
              </div>
              {renderFolderTree(null, 0)}
            </div>
          </div>
        )}

        {/* User menu at bottom */}
        {sidebarOpen && (
          <div
            style={{
              padding: '12px 8px',
              borderTop: '1px solid #1e1e2a',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <button
              onClick={() => {}}
              style={{
                background: 'none',
                border: '1px solid #2a2a3a',
                borderRadius: '50%',
                cursor: 'pointer',
                padding: 0,
                width: '32px',
                height: '32px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'border-color 0.15s',
                flexShrink: 0,
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#4a4a5e')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2a3a')}
            >
              {avatar ? (
                <img src={avatar} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>{initials}</span>
              )}
            </button>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ color: '#e2e8f0', fontSize: '12px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {name.split(' ')[0]}
              </div>
              <div style={{ color: '#4a4a6a', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Sign out
              </div>
            </div>
            <button
              onClick={handleSignOut}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.15s',
                flexShrink: 0,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#1c1c26'
                e.currentTarget.style.color = '#e2e8f0'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'none'
                e.currentTarget.style.color = '#64748b'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16,17 21,12 16,7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Resize handle */}
      {sidebarOpen && !isMobile && (
        <div
          ref={resizeRef}
          onMouseDown={handleResizeStart}
          style={{
            width: '1px',
            height: '100vh',
            background: 'transparent',
            cursor: 'col-resize',
            transition: 'background 0.15s',
            flexShrink: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#6366f1')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        />
      )}

      {/* Toggle button when sidebar is closed */}
      {!sidebarOpen && (
        <button
          onClick={onToggleSidebar}
          title="Open sidebar"
          style={{
            position: isMobile ? 'fixed' : 'relative',
            left: isMobile ? '8px' : 'auto',
            top: isMobile ? '8px' : 'auto',
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '6px',
            padding: '8px',
            color: '#a78bfa',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            zIndex: isMobile ? 25 : 'auto',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(99,102,241,0.2)'
            e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(99,102,241,0.1)'
            e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      )}
    </>
  )
}
