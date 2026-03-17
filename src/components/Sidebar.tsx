'use client'

import { useState, useRef, useEffect } from 'react'
import type { Folder, VaultFile } from '@/lib/supabase'

interface Props {
  folders: Folder[]
  files: VaultFile[]
  activeFileId: string | null
  open: boolean
  loading: boolean
  onSelectFile: (id: string) => void
  onNewFile: (folderId: string | null, name: string) => void
  onNewFolder: (name: string, parentId: string | null) => void
  onDeleteFile: (id: string) => void
  onDeleteFolder: (id: string) => void
  onRenameFile: (id: string, name: string) => void
}

type ContextMenu = {
  x: number
  y: number
  type: 'file' | 'folder'
  id: string
  name: string
}

export default function Sidebar({
  folders, files, activeFileId, open, loading,
  onSelectFile, onNewFile, onNewFolder, onDeleteFile, onDeleteFolder, onRenameFile
}: Props) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null)
  const [renaming, setRenaming] = useState<{ id: string; value: string } | null>(null)
  const renameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (renaming) renameRef.current?.focus()
  }, [renaming])

  useEffect(() => {
    function close() { setContextMenu(null) }
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [])

  function toggleFolder(id: string) {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleContextMenu(e: React.MouseEvent, type: 'file' | 'folder', id: string, name: string) {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, type, id, name })
  }

  function confirmRename() {
    if (renaming && renaming.value.trim()) {
      onRenameFile(renaming.id, renaming.value.trim())
    }
    setRenaming(null)
  }

  const rootFiles = files.filter(f => !f.folder_id)
  const rootFolders = folders.filter(f => !f.parent_id)

  function renderFile(file: VaultFile, depth = 0) {
    const isActive = file.id === activeFileId
    const isRenaming = renaming?.id === file.id

    return (
      <div
        key={file.id}
        onContextMenu={e => handleContextMenu(e, 'file', file.id, file.name)}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {isRenaming ? (
          <input
            ref={renameRef}
            value={renaming.value}
            onChange={e => setRenaming({ ...renaming, value: e.target.value })}
            onBlur={confirmRename}
            onKeyDown={e => {
              if (e.key === 'Enter') confirmRename()
              if (e.key === 'Escape') setRenaming(null)
            }}
            style={{
              background: '#1e1e2e',
              border: '1px solid #6366f1',
              borderRadius: '5px',
              color: '#e2e8f0',
              padding: '4px 8px',
              width: '100%',
              fontSize: '13px',
              fontFamily: 'inherit',
              outline: 'none',
              marginLeft: '-2px',
            }}
          />
        ) : (
          <button
            onClick={() => onSelectFile(file.id)}
            style={{
              width: '100%',
              background: isActive
                ? 'linear-gradient(90deg, rgba(99,102,241,0.18), rgba(139,92,246,0.1))'
                : 'none',
              border: 'none',
              borderRadius: '6px',
              padding: '5px 8px',
              color: isActive ? '#c4b5fd' : '#94a3b8',
              fontSize: '13px',
              fontFamily: 'inherit',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              transition: 'all 0.12s',
              borderLeft: isActive ? '2px solid #8b5cf6' : '2px solid transparent',
            }}
            onMouseEnter={e => {
              if (!isActive) e.currentTarget.style.background = '#1c1c26'
            }}
            onMouseLeave={e => {
              if (!isActive) e.currentTarget.style.background = 'none'
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.7 }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}>
              {file.name.replace(/\.md$/, '')}
            </span>
          </button>
        )}
      </div>
    )
  }

  function renderFolder(folder: Folder, depth = 0) {
    const isExpanded = expandedFolders.has(folder.id)
    const folderFiles = files.filter(f => f.folder_id === folder.id)
    const subFolders = folders.filter(f => f.parent_id === folder.id)

    return (
      <div key={folder.id} style={{ marginBottom: '1px' }}>
        <div
          onContextMenu={e => handleContextMenu(e, 'folder', folder.id, folder.name)}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <button
            onClick={() => toggleFolder(folder.id)}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              borderRadius: '6px',
              padding: '5px 8px',
              color: '#64748b',
              fontSize: '12px',
              fontWeight: '500',
              fontFamily: 'inherit',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.12s',
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
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
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                flexShrink: 0,
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.15s',
              }}
            >
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              {isExpanded ? (
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              ) : (
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              )}
            </svg>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {folder.name}
            </span>
            {(folderFiles.length + subFolders.length) > 0 && (
              <span style={{
                background: '#22222e',
                color: '#4a4a5e',
                borderRadius: '4px',
                padding: '1px 5px',
                fontSize: '10px',
                fontWeight: '600',
              }}>
                {folderFiles.length + subFolders.length}
              </span>
            )}
          </button>
        </div>

        {isExpanded && (
          <div style={{ animation: 'fadeIn 0.15s ease-out' }}>
            {subFolders.map(sf => renderFolder(sf, depth + 1))}
            {folderFiles.map(f => renderFile(f, depth + 1))}
            <div style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}>
              <button
                onClick={() => onNewFile(folder.id, 'Untitled')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#374151',
                  fontSize: '12px',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.12s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = '#6366f1'
                  e.currentTarget.style.background = 'rgba(99,102,241,0.08)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = '#374151'
                  e.currentTarget.style.background = 'none'
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add file
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div style={{
        width: open ? '260px' : '0px',
        minWidth: open ? '260px' : '0px',
        background: '#111118',
        borderRight: '1px solid #1e1e2a',
        overflow: open ? 'auto' : 'hidden',
        transition: 'width 0.2s ease, min-width 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {open && (
          <div style={{ padding: '12px 8px', flex: 1 }}>
            {loading ? (
              <div style={{ padding: '20px 12px' }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{
                    height: '28px',
                    background: '#1c1c26',
                    borderRadius: '6px',
                    marginBottom: '4px',
                    opacity: 1 - i * 0.15,
                  }}/>
                ))}
              </div>
            ) : (
              <>
                {/* Folders */}
                {rootFolders.length > 0 && (
                  <div style={{ marginBottom: '8px' }}>
                    {rootFolders.map(f => renderFolder(f))}
                  </div>
                )}

                {/* Root-level files */}
                {rootFiles.length > 0 && (
                  <div>
                    {rootFiles.map(f => renderFile(f))}
                  </div>
                )}

                {/* Empty state */}
                {folders.length === 0 && files.length === 0 && (
                  <div style={{ padding: '24px 12px', textAlign: 'center' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2a2a3a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 10px', display: 'block' }}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <p style={{ color: '#374151', fontSize: '12px', lineHeight: 1.5 }}>
                      No files yet.<br/>Create one to get started.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            background: '#1c1c26',
            border: '1px solid #2a2a3a',
            borderRadius: '8px',
            minWidth: '160px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
            zIndex: 1000,
            overflow: 'hidden',
            animation: 'fadeIn 0.1s ease-out',
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ padding: '6px' }}>
            {contextMenu.type === 'file' && (
              <ContextMenuItem
                icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>}
                label="Rename"
                onClick={() => {
                  setRenaming({ id: contextMenu.id, value: contextMenu.name })
                  setContextMenu(null)
                }}
              />
            )}
            {contextMenu.type === 'folder' && (
              <ContextMenuItem
                icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>}
                label="New file here"
                onClick={() => {
                  onNewFile(contextMenu.id, 'Untitled')
                  setContextMenu(null)
                }}
              />
            )}
            <div style={{ height: '1px', background: '#2a2a3a', margin: '4px 0' }} />
            <ContextMenuItem
              icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>}
              label="Delete"
              danger
              onClick={() => {
                if (contextMenu.type === 'file') onDeleteFile(contextMenu.id)
                else onDeleteFolder(contextMenu.id)
                setContextMenu(null)
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}

function ContextMenuItem({ icon, label, onClick, danger = false }: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        background: 'none',
        border: 'none',
        borderRadius: '5px',
        padding: '7px 10px',
        color: danger ? '#ef4444' : '#94a3b8',
        fontSize: '12px',
        fontFamily: 'inherit',
        cursor: 'pointer',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.12s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.1)' : '#22222e'
        e.currentTarget.style.color = danger ? '#fca5a5' : '#e2e8f0'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'none'
        e.currentTarget.style.color = danger ? '#ef4444' : '#94a3b8'
      }}
    >
      {icon}
      {label}
    </button>
  )
}
