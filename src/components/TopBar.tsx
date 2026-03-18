'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import type { Folder, VaultFile } from '@/lib/supabase'

interface SearchResult {
  file: VaultFile
  folderPath: string
  matchedContent: boolean
  snippet: string
}

interface Props {
  user: User | null
  sidebarOpen: boolean
  isMobile: boolean
  folders: Folder[]
  files: VaultFile[]
  onToggleSidebar: () => void
  onNewFile: () => void
  onNewFolder: () => void
  onSelectFile: (id: string) => void
}

function buildFolderPath(folderId: string | null, folders: Folder[]): string {
  if (!folderId) return ''
  const parts: string[] = []
  let current: string | null = folderId
  while (current) {
    const folder = folders.find(f => f.id === current)
    if (!folder) break
    parts.unshift(folder.name)
    current = folder.parent_id
  }
  return parts.join(' / ')
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'rgba(139,92,246,0.35)', color: '#c4b5fd', borderRadius: '2px', padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

function getContentSnippet(content: string, query: string): string {
  const lower = content.toLowerCase()
  const idx = lower.indexOf(query.toLowerCase())
  if (idx === -1) return ''
  const start = Math.max(0, idx - 30)
  const end = Math.min(content.length, idx + query.length + 50)
  return (start > 0 ? '…' : '') + content.slice(start, end) + (end < content.length ? '…' : '')
}

export default function TopBar({
  user, sidebarOpen, isMobile, folders, files,
  onToggleSidebar, onNewFile, onNewFolder, onSelectFile,
}: Props) {
  const [showMenu, setShowMenu] = useState(false)
  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createSupabaseBrowserClient()

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
      setShowMenu(false)
    }
    window.addEventListener('mousedown', handleClick)
    return () => window.removeEventListener('mousedown', handleClick)
  }, [])

  const results: SearchResult[] = useCallback(() => {
    if (!query.trim()) return []
    const q = query.trim().toLowerCase()
    return files
      .filter(f => {
        const nameMatch = f.name.toLowerCase().includes(q)
        const contentMatch = f.content?.toLowerCase().includes(q)
        return nameMatch || contentMatch
      })
      .slice(0, 10)
      .map(f => {
        const nameMatch = f.name.toLowerCase().includes(q)
        const snippet = nameMatch ? '' : getContentSnippet(f.content ?? '', query.trim())
        return {
          file: f,
          folderPath: buildFolderPath(f.folder_id, folders),
          matchedContent: !nameMatch,
          snippet,
        }
      })
  }, [query, files, folders])()

  useEffect(() => { setSelectedIdx(0) }, [query])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showResults || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIdx(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[selectedIdx]) {
        openResult(results[selectedIdx].file.id)
      }
    } else if (e.key === 'Escape') {
      setShowResults(false)
      inputRef.current?.blur()
    }
  }

  function openResult(fileId: string) {
    onSelectFile(fileId)
    setQuery('')
    setShowResults(false)
    inputRef.current?.blur()
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const avatar = user?.user_metadata?.avatar_url as string | undefined
  const name = (user?.user_metadata?.full_name as string) || user?.email || 'Travis'
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div style={{
      height: '52px',
      background: '#111118',
      borderBottom: '1px solid #1e1e2a',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: '10px',
      flexShrink: 0,
      zIndex: 30,
    }}>
      {/* Sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '6px', borderRadius: '6px', color: '#64748b',
          display: 'flex', alignItems: 'center', transition: 'all 0.15s', flexShrink: 0,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#1c1c26')}
        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
      >
        {isMobile ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/>
          </svg>
        )}
      </button>

      {/* Wordmark + nav — hidden on mobile to save space */}
      {!isMobile && (
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
          <Link href="/vault" style={{
            fontSize: '15px', fontWeight: '600',
            background: 'linear-gradient(135deg, #e2e8f0, #94a3b8)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.01em', textDecoration: 'none',
          }}>
            OpsVault
          </Link>
          {/* Nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
            <Link
              href="/"
              style={{
                fontSize: '12px', fontWeight: '500', textDecoration: 'none',
                color: pathname === '/' ? '#a78bfa' : '#64748b',
                padding: '3px 9px', borderRadius: '6px',
                background: pathname === '/' ? 'rgba(139,92,246,0.1)' : 'none',
                border: pathname === '/' ? '1px solid rgba(139,92,246,0.2)' : '1px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              Dashboard
            </Link>
            <Link
              href="/vault"
              style={{
                fontSize: '12px', fontWeight: '500', textDecoration: 'none',
                color: pathname === '/vault' || pathname.startsWith('/vault') ? '#a78bfa' : '#64748b',
                padding: '3px 9px', borderRadius: '6px',
                background: pathname === '/vault' || pathname.startsWith('/vault') ? 'rgba(139,92,246,0.1)' : 'none',
                border: pathname === '/vault' || pathname.startsWith('/vault') ? '1px solid rgba(139,92,246,0.2)' : '1px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              Vault
            </Link>
          </div>
        </div>
      )}

      {/* Search bar — takes up center space */}
      <div ref={searchRef} style={{ flex: 1, maxWidth: '480px', margin: '0 auto', position: 'relative' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: '#1a1a24', border: `1px solid ${showResults && results.length > 0 ? '#3a3a50' : '#22222e'}`,
          borderRadius: showResults && results.length > 0 ? '8px 8px 0 0' : '8px',
          padding: '0 10px', transition: 'border-color 0.15s',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4a4a6a" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search files…"
            value={query}
            onChange={e => { setQuery(e.target.value); setShowResults(true) }}
            onFocus={() => setShowResults(true)}
            onKeyDown={handleKeyDown}
            style={{
              background: 'none', border: 'none', outline: 'none',
              color: '#e2e8f0', fontSize: '13px', fontFamily: 'inherit',
              width: '100%', padding: '8px 0', caretColor: '#8b5cf6',
            }}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setShowResults(false) }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#4a4a6a', padding: '2px', display: 'flex', flexShrink: 0,
                borderRadius: '4px',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {/* Results dropdown */}
        {showResults && query.trim() && (
          <div style={{
            position: 'absolute',
            top: '100%', left: 0, right: 0,
            background: '#1a1a24',
            border: '1px solid #3a3a50',
            borderTop: 'none',
            borderRadius: '0 0 10px 10px',
            boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
            zIndex: 100,
            maxHeight: '360px',
            overflowY: 'auto',
          }}>
            {results.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#4a4a6a', fontSize: '13px' }}>
                No results for &ldquo;{query}&rdquo;
              </div>
            ) : (
              <>
                <div style={{ padding: '6px 10px 4px', color: '#4a4a6a', fontSize: '11px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {results.length} result{results.length !== 1 ? 's' : ''}
                </div>
                {results.map((r, i) => (
                  <button
                    key={r.file.id}
                    onMouseDown={e => { e.preventDefault(); openResult(r.file.id) }}
                    onMouseEnter={() => setSelectedIdx(i)}
                    style={{
                      width: '100%', background: i === selectedIdx ? '#22222e' : 'none',
                      border: 'none', borderRadius: '0',
                      padding: '9px 12px', textAlign: 'left',
                      cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '3px',
                      transition: 'background 0.1s',
                      borderBottom: i < results.length - 1 ? '1px solid #1e1e2a' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      <span style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: '500' }}>
                        {highlight(r.file.name.replace(/\.md$/, ''), query.trim())}
                      </span>
                      {r.folderPath && (
                        <span style={{ color: '#4a4a6a', fontSize: '11px', marginLeft: '2px' }}>
                          in {r.folderPath}
                        </span>
                      )}
                    </div>
                    {r.matchedContent && r.snippet && (
                      <div style={{ color: '#64748b', fontSize: '11px', paddingLeft: '18px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {highlight(r.snippet, query.trim())}
                      </div>
                    )}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <button
          onClick={onNewFile}
          title="New File"
          style={{
            background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: '7px', padding: isMobile ? '7px' : '5px 11px',
            color: '#a78bfa', fontSize: '12px', fontWeight: '500', fontFamily: 'inherit',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.2)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.35)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.12)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {!isMobile && 'New File'}
        </button>

        <button
          onClick={onNewFolder}
          title="New Folder"
          style={{
            background: 'none', border: '1px solid #2a2a3a', borderRadius: '7px',
            padding: isMobile ? '7px' : '5px 11px', color: '#64748b',
            fontSize: '12px', fontWeight: '500', fontFamily: 'inherit',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#1c1c26'; e.currentTarget.style.color = '#94a3b8' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#64748b' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            <line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>
          </svg>
          {!isMobile && 'New Folder'}
        </button>

        {/* User avatar */}
        <div style={{ position: 'relative', marginLeft: '4px' }}>
          <button
            onClick={e => { e.stopPropagation(); setShowMenu(p => !p) }}
            style={{
              background: 'none', border: '1px solid #2a2a3a', borderRadius: '50%',
              cursor: 'pointer', padding: 0, width: '30px', height: '30px',
              overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#4a4a5e')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2a3a')}
          >
            {avatar ? (
              <img src={avatar} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '600' }}>{initials}</span>
            )}
          </button>

          {showMenu && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              background: '#1c1c26', border: '1px solid #2a2a3a', borderRadius: '10px',
              minWidth: '200px', boxShadow: '0 16px 40px rgba(0,0,0,0.4)', zIndex: 100, overflow: 'hidden',
            }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid #2a2a3a' }}>
                <div style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: '500', marginBottom: '2px' }}>{name}</div>
                <div style={{ color: '#64748b', fontSize: '12px' }}>{user?.email}</div>
              </div>
              <button
                onClick={handleSignOut}
                style={{
                  width: '100%', background: 'none', border: 'none', padding: '10px 14px',
                  color: '#94a3b8', fontSize: '13px', fontFamily: 'inherit', cursor: 'pointer',
                  textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#22222e'; e.currentTarget.style.color = '#e2e8f0' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#94a3b8' }}
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
