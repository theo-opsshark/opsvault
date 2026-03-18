'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { Folder, VaultFile } from '@/lib/supabase'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Props {
  folders: Folder[]
  files: VaultFile[]
  activeFileId: string | null
  open: boolean
  isMobile: boolean
  loading: boolean
  sidebarWidth: number
  onSidebarWidthChange: (width: number) => void
  onSelectFile: (id: string) => void
  onNewFile: (folderId: string | null, name: string) => void
  onNewFolder: (name: string, parentId: string | null) => void
  onDeleteFile: (id: string) => void
  onDeleteFolder: (id: string) => void
  onRenameFile: (id: string, name: string) => void
  onRenameFolder: (id: string, name: string) => void
  onReorderFolders: (reordered: Folder[]) => void
  onReorderFiles: (reordered: VaultFile[]) => void
}

type ContextMenu = {
  x: number
  y: number
  type: 'file' | 'folder'
  id: string
  name: string
}

// ─── Sortable file row ──────────────────────────────────────────────────────

interface SortableFileProps {
  file: VaultFile
  isActive: boolean
  depth: number
  isRenaming: boolean
  renameValue: string
  onRenameChange: (v: string) => void
  onRenameBlur: () => void
  onRenameKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  renameRef: React.RefObject<HTMLInputElement | null>
  onSelect: () => void
  onContextMenu: (e: React.MouseEvent) => void
}

function SortableFile({
  file, isActive, depth, isRenaming, renameValue,
  onRenameChange, onRenameBlur, onRenameKeyDown, renameRef,
  onSelect, onContextMenu,
}: SortableFileProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `file:${file.id}` })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    paddingLeft: `${depth * 12 + 8}px`,
  }

  return (
    <div ref={setNodeRef} style={style} onContextMenu={onContextMenu}>
      {isRenaming ? (
        <input
          ref={renameRef}
          value={renameValue}
          onChange={e => onRenameChange(e.target.value)}
          onBlur={onRenameBlur}
          onKeyDown={onRenameKeyDown}
          style={{
            background: '#1e1e2e', border: '1px solid #6366f1', borderRadius: '5px',
            color: '#e2e8f0', padding: '4px 8px', width: '100%',
            fontSize: '13px', fontFamily: 'inherit', outline: 'none', marginLeft: '-2px',
          }}
        />
      ) : (
        <button
          onClick={onSelect}
          style={{
            width: '100%',
            background: isActive ? 'linear-gradient(90deg, rgba(99,102,241,0.18), rgba(139,92,246,0.1))' : 'none',
            border: 'none', borderRadius: '6px',
            padding: '0 8px',
            minHeight: '40px',
            color: isActive ? '#c4b5fd' : '#94a3b8',
            fontSize: '14px', fontFamily: 'inherit', cursor: 'pointer',
            textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px',
            transition: 'all 0.12s',
            borderLeft: isActive ? '2px solid #8b5cf6' : '2px solid transparent',
          }}
          onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#1c1c26' }}
          onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'none' }}
        >
          {/* Drag handle */}
          <span
            {...attributes}
            {...listeners}
            style={{ cursor: 'grab', color: '#2e2e42', flexShrink: 0, display: 'flex', alignItems: 'center', touchAction: 'none' }}
            onClick={e => e.stopPropagation()}
          >
            <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
              <circle cx="3" cy="3" r="1.2"/><circle cx="7" cy="3" r="1.2"/>
              <circle cx="3" cy="7" r="1.2"/><circle cx="7" cy="7" r="1.2"/>
              <circle cx="3" cy="11" r="1.2"/><circle cx="7" cy="11" r="1.2"/>
            </svg>
          </span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.7 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {file.name.replace(/\.md$/, '')}
          </span>
        </button>
      )}
    </div>
  )
}

// ─── Sortable folder row ────────────────────────────────────────────────────

interface SortableFolderRowProps {
  folder: Folder
  depth: number
  isExpanded: boolean
  fileCount: number
  isRenaming: boolean
  renameValue: string
  onRenameChange: (v: string) => void
  onRenameBlur: () => void
  onRenameKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  renameRef: React.RefObject<HTMLInputElement | null>
  onToggle: () => void
  onContextMenu: (e: React.MouseEvent) => void
}

function SortableFolderRow({
  folder, depth, isExpanded, fileCount, isRenaming, renameValue,
  onRenameChange, onRenameBlur, onRenameKeyDown, renameRef,
  onToggle, onContextMenu,
}: SortableFolderRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `folder:${folder.id}` })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    marginBottom: '1px',
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div onContextMenu={onContextMenu} style={{ paddingLeft: `${depth * 12 + 8}px` }}>
        {isRenaming ? (
          <input
            ref={renameRef}
            value={renameValue}
            onChange={e => onRenameChange(e.target.value)}
            onBlur={onRenameBlur}
            onKeyDown={onRenameKeyDown}
            style={{
              background: '#1e1e2e', border: '1px solid #6366f1', borderRadius: '5px',
              color: '#e2e8f0', padding: '4px 8px', width: '100%',
              fontSize: '13px', fontFamily: 'inherit', outline: 'none',
            }}
          />
        ) : (
          <button
            onClick={onToggle}
            style={{
              width: '100%', background: 'none', border: 'none', borderRadius: '6px',
              padding: '0 8px', minHeight: '40px',
              color: '#64748b', fontSize: '13px', fontWeight: '500', fontFamily: 'inherit',
              cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center',
              gap: '6px', transition: 'all 0.12s', letterSpacing: '0.02em', textTransform: 'uppercase',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1c1c26'; e.currentTarget.style.color = '#94a3b8' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#64748b' }}
          >
            {/* Drag handle */}
            <span
              {...attributes}
              {...listeners}
              style={{ cursor: 'grab', color: '#2e2e42', flexShrink: 0, display: 'flex', alignItems: 'center', touchAction: 'none' }}
              onClick={e => e.stopPropagation()}
            >
              <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
                <circle cx="3" cy="3" r="1.2"/><circle cx="7" cy="3" r="1.2"/>
                <circle cx="3" cy="7" r="1.2"/><circle cx="7" cy="7" r="1.2"/>
                <circle cx="3" cy="11" r="1.2"/><circle cx="7" cy="11" r="1.2"/>
              </svg>
            </span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ flexShrink: 0, transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {folder.name}
            </span>
            {fileCount > 0 && (
              <span style={{ background: '#22222e', color: '#4a4a5e', borderRadius: '4px', padding: '1px 5px', fontSize: '10px', fontWeight: '600' }}>
                {fileCount}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main Sidebar ───────────────────────────────────────────────────────────

export default function Sidebar({
  folders, files, activeFileId, open, isMobile, loading,
  sidebarWidth, onSidebarWidthChange,
  onSelectFile, onNewFile, onNewFolder,
  onDeleteFile, onDeleteFolder, onRenameFile, onRenameFolder,
  onReorderFolders, onReorderFiles,
}: Props) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null)
  const [renaming, setRenaming] = useState<{ id: string; value: string; type: 'file' | 'folder' } | null>(null)
  const renameRef = useRef<HTMLInputElement>(null)
  const isResizing = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  useEffect(() => { if (renaming) renameRef.current?.focus() }, [renaming])

  useEffect(() => {
    function close() { setContextMenu(null) }
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [])

  // Resize drag handlers
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isResizing.current = true
    startX.current = e.clientX
    startWidth.current = sidebarWidth

    function onMouseMove(ev: MouseEvent) {
      if (!isResizing.current) return
      const delta = ev.clientX - startX.current
      const newWidth = Math.max(180, Math.min(480, startWidth.current + delta))
      onSidebarWidthChange(newWidth)
    }
    function onMouseUp() {
      isResizing.current = false
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [sidebarWidth, onSidebarWidthChange])

  // Collapse / Expand all
  const allFolderIds = folders.map(f => f.id)
  const foldersWithContent = folders.filter(f =>
    files.some(file => file.folder_id === f.id) || folders.some(sub => sub.parent_id === f.id)
  )
  const allExpanded = foldersWithContent.length > 0 && foldersWithContent.every(f => expandedFolders.has(f.id))

  function toggleAllFolders() {
    if (allExpanded) {
      setExpandedFolders(new Set())
    } else {
      setExpandedFolders(new Set(allFolderIds))
    }
  }

  function toggleFolder(id: string) {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleContextMenu(e: React.MouseEvent, type: 'file' | 'folder', id: string, name: string) {
    e.preventDefault(); e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, type, id, name })
  }

  function confirmRename() {
    if (renaming?.value.trim()) {
      if (renaming.type === 'folder') onRenameFolder(renaming.id, renaming.value.trim())
      else onRenameFile(renaming.id, renaming.value.trim())
    }
    setRenaming(null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeStr = active.id as string
    const overStr = over.id as string

    if (activeStr.startsWith('folder:') && overStr.startsWith('folder:')) {
      const activeId = activeStr.replace('folder:', '')
      const overId = overStr.replace('folder:', '')
      const rootFolders = folders.filter(f => !f.parent_id)
      const oldIdx = rootFolders.findIndex(f => f.id === activeId)
      const newIdx = rootFolders.findIndex(f => f.id === overId)
      if (oldIdx !== -1 && newIdx !== -1) {
        onReorderFolders(arrayMove(rootFolders, oldIdx, newIdx))
      }
      return
    }

    if (activeStr.startsWith('file:') && overStr.startsWith('file:')) {
      const activeId = activeStr.replace('file:', '')
      const overId = overStr.replace('file:', '')
      const activeFile = files.find(f => f.id === activeId)
      const overFile = files.find(f => f.id === overId)
      if (!activeFile || !overFile) return
      // Only reorder within same level (same folder_id)
      if (activeFile.folder_id !== overFile.folder_id) return
      const scopedFiles = files.filter(f => f.folder_id === activeFile.folder_id)
      const oldIdx = scopedFiles.findIndex(f => f.id === activeId)
      const newIdx = scopedFiles.findIndex(f => f.id === overId)
      if (oldIdx !== -1 && newIdx !== -1) {
        onReorderFiles(arrayMove(scopedFiles, oldIdx, newIdx))
      }
    }
  }

  const rootFiles = files.filter(f => !f.folder_id)
  const rootFolders = folders.filter(f => !f.parent_id)

  function renderFolderContents(folder: Folder, depth: number) {
    const isExpanded = expandedFolders.has(folder.id)
    if (!isExpanded) return null
    const folderFiles = files.filter(f => f.folder_id === folder.id)
    const subFolders = folders.filter(f => f.parent_id === folder.id)

    return (
      <div style={{ animation: 'fadeIn 0.15s ease-out' }}>
        <SortableContext
          items={subFolders.map(f => `folder:${f.id}`)}
          strategy={verticalListSortingStrategy}
        >
          {subFolders.map(sf => (
            <div key={sf.id}>
              <SortableFolderRow
                folder={sf}
                depth={depth + 1}
                isExpanded={expandedFolders.has(sf.id)}
                fileCount={files.filter(f => f.folder_id === sf.id).length + folders.filter(f => f.parent_id === sf.id).length}
                isRenaming={renaming?.id === sf.id && renaming.type === 'folder'}
                renameValue={renaming?.id === sf.id ? renaming.value : sf.name}
                onRenameChange={v => renaming && setRenaming({ ...renaming, value: v })}
                onRenameBlur={confirmRename}
                onRenameKeyDown={e => {
                  if (e.key === 'Enter') confirmRename()
                  if (e.key === 'Escape') setRenaming(null)
                }}
                renameRef={renameRef}
                onToggle={() => toggleFolder(sf.id)}
                onContextMenu={e => handleContextMenu(e, 'folder', sf.id, sf.name)}
              />
              {renderFolderContents(sf, depth + 1)}
            </div>
          ))}
        </SortableContext>
        <SortableContext
          items={folderFiles.map(f => `file:${f.id}`)}
          strategy={verticalListSortingStrategy}
        >
          {folderFiles.map(f => (
            <SortableFile
              key={f.id}
              file={f}
              isActive={f.id === activeFileId}
              depth={depth + 1}
              isRenaming={renaming?.id === f.id && renaming.type === 'file'}
              renameValue={renaming?.id === f.id ? renaming.value : f.name}
              onRenameChange={v => renaming && setRenaming({ ...renaming, value: v })}
              onRenameBlur={confirmRename}
              onRenameKeyDown={e => {
                if (e.key === 'Enter') confirmRename()
                if (e.key === 'Escape') setRenaming(null)
              }}
              renameRef={renameRef}
              onSelect={() => onSelectFile(f.id)}
              onContextMenu={e => handleContextMenu(e, 'file', f.id, f.name)}
            />
          ))}
        </SortableContext>
        <div style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}>
          <button
            onClick={() => onNewFile(folder.id, 'Untitled')}
            style={{
              background: 'none', border: 'none', color: '#374151', fontSize: '12px',
              fontFamily: 'inherit', cursor: 'pointer', padding: '4px 8px', borderRadius: '5px',
              display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#6366f1'; e.currentTarget.style.background = 'rgba(99,102,241,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#374151'; e.currentTarget.style.background = 'none' }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add file
          </button>
        </div>
      </div>
    )
  }

  const sidebarStyle: React.CSSProperties = isMobile ? {
    position: 'absolute',
    top: 0, left: 0, bottom: 0,
    width: '280px',
    background: '#111118',
    borderRight: '1px solid #1e1e2a',
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 25,
    transform: open ? 'translateX(0)' : 'translateX(-100%)',
    transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
  } : {
    width: open ? `${sidebarWidth}px` : '0px',
    minWidth: open ? `${sidebarWidth}px` : '0px',
    background: '#111118',
    borderRight: '1px solid #1e1e2a',
    overflow: open ? 'auto' : 'hidden',
    transition: isResizing.current ? 'none' : 'width 0.2s ease, min-width 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  }

  return (
    <>
      <div style={sidebarStyle}>
        {(open || isMobile) && (
          <>
          {/* Sidebar header with collapse/expand all */}
          {foldersWithContent.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
              padding: '6px 10px 0',
              borderBottom: '1px solid #1a1a24',
              paddingBottom: '6px',
            }}>
              <button
                onClick={toggleAllFolders}
                title={allExpanded ? 'Collapse all' : 'Expand all'}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#3a3a52', padding: '3px 5px', borderRadius: '4px',
                  display: 'flex', alignItems: 'center', gap: '2px',
                  transition: 'all 0.12s', fontSize: '10px', fontFamily: 'inherit',
                  letterSpacing: '0.03em',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#6366f1'; e.currentTarget.style.background = 'rgba(99,102,241,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#3a3a52'; e.currentTarget.style.background = 'none' }}
              >
                {/* Double chevron icon — up = collapse, down = expand */}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: allExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                  <polyline points="17 11 12 6 7 11"/>
                  <polyline points="17 18 12 13 7 18"/>
                </svg>
              </button>
            </div>
          )}
          <div style={{ padding: '12px 8px', flex: 1 }}>
            {loading ? (
              <div style={{ padding: '20px 12px' }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ height: '40px', background: '#1c1c26', borderRadius: '6px', marginBottom: '4px', opacity: 1 - i * 0.15 }}/>
                ))}
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                {/* Root folders */}
                {rootFolders.length > 0 && (
                  <div style={{ marginBottom: '8px' }}>
                    <SortableContext
                      items={rootFolders.map(f => `folder:${f.id}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      {rootFolders.map(folder => (
                        <div key={folder.id}>
                          <SortableFolderRow
                            folder={folder}
                            depth={0}
                            isExpanded={expandedFolders.has(folder.id)}
                            fileCount={files.filter(f => f.folder_id === folder.id).length + folders.filter(f => f.parent_id === folder.id).length}
                            isRenaming={renaming?.id === folder.id && renaming.type === 'folder'}
                            renameValue={renaming?.id === folder.id ? renaming.value : folder.name}
                            onRenameChange={v => renaming && setRenaming({ ...renaming, value: v })}
                            onRenameBlur={confirmRename}
                            onRenameKeyDown={e => {
                              if (e.key === 'Enter') confirmRename()
                              if (e.key === 'Escape') setRenaming(null)
                            }}
                            renameRef={renameRef}
                            onToggle={() => toggleFolder(folder.id)}
                            onContextMenu={e => handleContextMenu(e, 'folder', folder.id, folder.name)}
                          />
                          {renderFolderContents(folder, 0)}
                        </div>
                      ))}
                    </SortableContext>
                  </div>
                )}

                {/* Root-level files */}
                {rootFiles.length > 0 && (
                  <SortableContext
                    items={rootFiles.map(f => `file:${f.id}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    {rootFiles.map(f => (
                      <SortableFile
                        key={f.id}
                        file={f}
                        isActive={f.id === activeFileId}
                        depth={0}
                        isRenaming={renaming?.id === f.id && renaming.type === 'file'}
                        renameValue={renaming?.id === f.id ? renaming.value : f.name}
                        onRenameChange={v => renaming && setRenaming({ ...renaming, value: v })}
                        onRenameBlur={confirmRename}
                        onRenameKeyDown={e => {
                          if (e.key === 'Enter') confirmRename()
                          if (e.key === 'Escape') setRenaming(null)
                        }}
                        renameRef={renameRef}
                        onSelect={() => onSelectFile(f.id)}
                        onContextMenu={e => handleContextMenu(e, 'file', f.id, f.name)}
                      />
                    ))}
                  </SortableContext>
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
              </DndContext>
            )}
          </div>
          {/* Resize handle — only on desktop */}
          {!isMobile && (
            <div
              onMouseDown={handleResizeMouseDown}
              style={{
                position: 'absolute', top: 0, right: 0, bottom: 0,
                width: '4px', cursor: 'col-resize',
                background: 'rgba(99,102,241,0.08)',
                transition: 'background 0.15s',
                zIndex: 10,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(99,102,241,0.35)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(99,102,241,0.08)' }}
            />
          )}
          </>
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed', top: contextMenu.y, left: contextMenu.x,
            background: '#1c1c26', border: '1px solid #2a2a3a', borderRadius: '8px',
            minWidth: '160px', boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
            zIndex: 1000, overflow: 'hidden', animation: 'fadeIn 0.1s ease-out',
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ padding: '6px' }}>
            {contextMenu.type === 'file' && (
              <ContextMenuItem
                icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>}
                label="Rename"
                onClick={() => { setRenaming({ id: contextMenu.id, value: contextMenu.name, type: 'file' }); setContextMenu(null) }}
              />
            )}
            {contextMenu.type === 'folder' && (
              <>
                <ContextMenuItem
                  icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>}
                  label="Rename"
                  onClick={() => { setRenaming({ id: contextMenu.id, value: contextMenu.name, type: 'folder' }); setContextMenu(null) }}
                />
                <ContextMenuItem
                  icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>}
                  label="New file here"
                  onClick={() => { onNewFile(contextMenu.id, 'Untitled'); setContextMenu(null) }}
                />
              </>
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
        width: '100%', background: 'none', border: 'none', borderRadius: '5px',
        padding: '7px 10px', color: danger ? '#ef4444' : '#94a3b8',
        fontSize: '12px', fontFamily: 'inherit', cursor: 'pointer',
        textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.12s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.1)' : '#22222e'; e.currentTarget.style.color = danger ? '#fca5a5' : '#e2e8f0' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = danger ? '#ef4444' : '#94a3b8' }}
    >
      {icon}{label}
    </button>
  )
}
