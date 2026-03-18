'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { VaultFile } from '@/lib/supabase'
import MarkdownRenderer from './MarkdownRenderer'

interface Props {
  file: VaultFile | null
  onSave: (id: string, content: string) => Promise<void>
  sidebarOpen: boolean
}

interface Props {
  file: VaultFile | null
  onSave: (id: string, content: string) => Promise<void>
  onRename?: (id: string, name: string) => Promise<void>
  sidebarOpen: boolean
}

export default function MainPanel({ file, onSave, onRename, sidebarOpen }: Props) {
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [renamingTitle, setRenamingTitle] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (file) {
      setDraft(file.content)
      setMode('view')
      setNewTitle(file.name.replace(/\.md$/, ''))
    }
  }, [file?.id])

  useEffect(() => {
    if (renamingTitle && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [renamingTitle])

  const handleRenameSubmit = async () => {
    if (!file || !newTitle.trim() || newTitle === file.name.replace(/\.md$/, '')) {
      setRenamingTitle(false)
      return
    }
    if (onRename) {
      await onRename(file.id, newTitle.trim() + '.md')
    }
    setRenamingTitle(false)
  }

  const autoSave = useCallback(async (content: string) => {
    if (!file) return
    setSaving(true)
    await onSave(file.id, content)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [file, onSave])

  function handleContentChange(val: string) {
    setDraft(val)
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => autoSave(val), 1200)
  }

  async function handleManualSave() {
    if (!file || saving) return
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    await autoSave(draft)
  }

  if (!file) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f0f13',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          background: 'rgba(139,92,246,0.08)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(139,92,246,0.12)',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#4a4a5e', fontSize: '15px', fontWeight: '500', marginBottom: '6px' }}>
            No file selected
          </p>
          <p style={{ color: '#374151', fontSize: '13px' }}>
            Pick a file from the sidebar or create a new one
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: '#0f0f13',
      animation: 'fadeIn 0.2s ease-out',
    }}>
      {/* File toolbar */}
      <div style={{
        height: '44px',
        background: '#0f0f13',
        borderBottom: '1px solid #1a1a24',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: '12px',
        flexShrink: 0,
      }}>
        {/* File path / name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, cursor: 'pointer' }} onClick={() => setRenamingTitle(true)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4a4a5e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          {renamingTitle ? (
            <input
              ref={renameInputRef}
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleRenameSubmit()
                if (e.key === 'Escape') setRenamingTitle(false)
              }}
              onBlur={handleRenameSubmit}
              style={{
                background: 'rgba(139,92,246,0.1)',
                border: '1px solid rgba(139,92,246,0.3)',
                borderRadius: '4px',
                color: '#c4b5fd',
                fontSize: '13px',
                padding: '3px 6px',
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
          ) : (
            <span style={{ color: '#64748b', fontSize: '13px' }}>
              {file.name.replace(/\.md$/, '')}
            </span>
          )}
          <span style={{
            color: '#2a2a3a',
            fontSize: '11px',
            background: '#161620',
            border: '1px solid #1e1e2a',
            borderRadius: '4px',
            padding: '1px 6px',
            marginLeft: '4px',
          }}>
            md
          </span>
        </div>

        {/* Save status */}
        <div style={{ color: '#374151', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          {saving && (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                <circle cx="12" cy="12" r="10" strokeDasharray="31.416" strokeDashoffset="10"/>
              </svg>
              Saving…
            </>
          )}
          {saved && !saving && (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span style={{ color: '#4ade80' }}>Saved</span>
            </>
          )}
        </div>

        {/* Mode toggle */}
        <div style={{
          background: '#16161e',
          border: '1px solid #2a2a3a',
          borderRadius: '7px',
          padding: '3px',
          display: 'flex',
          gap: '2px',
        }}>
          {(['view', 'edit'] as const).map(m => (
            <button
              key={m}
              onClick={() => {
                if (m === 'view' && mode === 'edit') {
                  if (saveTimeout.current) clearTimeout(saveTimeout.current)
                  autoSave(draft)
                }
                setMode(m)
              }}
              style={{
                background: mode === m ? 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(99,102,241,0.2))' : 'none',
                border: mode === m ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
                borderRadius: '5px',
                padding: '3px 10px',
                color: mode === m ? '#c4b5fd' : '#4a4a5e',
                fontSize: '12px',
                fontWeight: '500',
                fontFamily: 'inherit',
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              {m === 'view' ? (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              ) : (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              )}
              {m === 'view' ? 'Preview' : 'Edit'}
            </button>
          ))}
        </div>

        {/* Keyboard shortcut hint */}
        {mode === 'edit' && (
          <button
            onClick={handleManualSave}
            style={{
              background: 'none',
              border: '1px solid #2a2a3a',
              borderRadius: '6px',
              padding: '4px 10px',
              color: '#4a4a5e',
              fontSize: '11px',
              fontFamily: 'inherit',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#4a4a5e'
              e.currentTarget.style.color = '#64748b'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#2a2a3a'
              e.currentTarget.style.color = '#4a4a5e'
            }}
          >
            ⌘S Save
          </button>
        )}
      </div>

      {/* Content area */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        {mode === 'view' ? (
          <div style={{
            maxWidth: '780px',
            margin: '0 auto',
            padding: '40px 48px',
          }}>
            <MarkdownRenderer content={file.content} />
            <div style={{ height: '80px' }} />
          </div>
        ) : (
          <textarea
            value={draft}
            onChange={e => handleContentChange(e.target.value)}
            onKeyDown={e => {
              if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault()
                handleManualSave()
              }
            }}
            style={{
              width: '100%',
              height: '100%',
              background: '#0c0c10',
              border: 'none',
              color: '#cbd5e1',
              fontSize: '14px',
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
              lineHeight: '1.7',
              padding: '32px 48px',
              resize: 'none',
              outline: 'none',
              maxWidth: '780px',
              margin: '0 auto',
              display: 'block',
              caretColor: '#8b5cf6',
            }}
            spellCheck={false}
          />
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
