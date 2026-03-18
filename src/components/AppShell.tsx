'use client'

import { useState, useEffect, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import type { Folder, VaultFile } from '@/lib/supabase'
import Sidebar from './Sidebar'
import MainPanel from './MainPanel'
import TopBar from './TopBar'

interface Props {
  user: User | null
}

export default function AppShell({ user }: Props) {
  const [folders, setFolders] = useState<Folder[]>([])
  const [files, setFiles] = useState<VaultFile[]>([])
  const [activeFileId, setActiveFileId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  const supabase = createSupabaseBrowserClient()

  // Detect mobile
  useEffect(() => {
    function check() {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setSidebarOpen(false)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const loadData = useCallback(async () => {
    const [{ data: foldersData }, { data: filesData }] = await Promise.all([
      supabase.from('folders').select('*').order('sort_order', { ascending: true, nullsFirst: false }),
      supabase.from('files').select('*').order('sort_order', { ascending: true, nullsFirst: false }),
    ])
    // Sort by created_at for nulls
    const sortedFolders = (foldersData ?? []).sort((a, b) => {
      if (a.sort_order != null && b.sort_order != null) return a.sort_order - b.sort_order
      if (a.sort_order != null) return -1
      if (b.sort_order != null) return 1
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })
    const sortedFiles = (filesData ?? []).sort((a, b) => {
      if (a.sort_order != null && b.sort_order != null) return a.sort_order - b.sort_order
      if (a.sort_order != null) return -1
      if (b.sort_order != null) return 1
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })
    setFolders(sortedFolders)
    setFiles(sortedFiles)
    setLoading(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadData()
  }, [loadData])

  const activeFile = files.find(f => f.id === activeFileId) ?? null

  async function handleNewFile(folderId: string | null, name: string) {
    const { data, error } = await supabase
      .from('files')
      .insert({ name, content: `# ${name}\n\n`, folder_id: folderId, author: user?.email ?? 'travis' })
      .select()
      .single()
    if (!error && data) {
      setFiles(prev => [...prev, data])
      setActiveFileId(data.id)
      if (isMobile) setSidebarOpen(false)
    }
  }

  async function handleNewFolder(name: string, parentId: string | null = null) {
    const { data, error } = await supabase
      .from('folders')
      .insert({ name, parent_id: parentId })
      .select()
      .single()
    if (!error && data) {
      setFolders(prev => [...prev, data])
    }
  }

  async function handleSaveFile(id: string, content: string) {
    const { data, error } = await supabase
      .from('files')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (!error && data) {
      setFiles(prev => prev.map(f => f.id === id ? data : f))
    }
  }

  async function handleDeleteFile(id: string) {
    await supabase.from('files').delete().eq('id', id)
    setFiles(prev => prev.filter(f => f.id !== id))
    if (activeFileId === id) setActiveFileId(null)
  }

  async function handleDeleteFolder(id: string) {
    await supabase.from('files').delete().eq('folder_id', id)
    await supabase.from('folders').delete().eq('id', id)
    setFiles(prev => prev.filter(f => f.folder_id !== id))
    setFolders(prev => prev.filter(f => f.id !== id))
  }

  async function handleRenameFile(id: string, name: string) {
    const { data } = await supabase.from('files').update({ name }).eq('id', id).select().single()
    if (data) setFiles(prev => prev.map(f => f.id === id ? data : f))
  }

  async function handleRenameFolder(id: string, name: string) {
    const { data } = await supabase.from('folders').update({ name }).eq('id', id).select().single()
    if (data) setFolders(prev => prev.map(f => f.id === id ? data : f))
  }

  async function handleReorderFolders(reordered: Folder[]) {
    setFolders(prev => {
      const reorderedIds = new Set(reordered.map(f => f.id))
      const unchanged = prev.filter(f => !reorderedIds.has(f.id))
      return [...reordered, ...unchanged]
    })
    // Update sort_order in Supabase
    await Promise.all(
      reordered.map((f, i) =>
        supabase.from('folders').update({ sort_order: i }).eq('id', f.id)
      )
    )
  }

  async function handleReorderFiles(reordered: VaultFile[]) {
    setFiles(prev => {
      const reorderedIds = new Set(reordered.map(f => f.id))
      const unchanged = prev.filter(f => !reorderedIds.has(f.id))
      return [...reordered, ...unchanged]
    })
    await Promise.all(
      reordered.map((f, i) =>
        supabase.from('files').update({ sort_order: i }).eq('id', f.id)
      )
    )
  }

  function handleSelectFile(id: string) {
    setActiveFileId(id)
    if (isMobile) setSidebarOpen(false)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#0f0f13',
      overflow: 'hidden',
    }}>
      <TopBar
        user={user}
        sidebarOpen={sidebarOpen}
        isMobile={isMobile}
        folders={folders}
        files={files}
        onToggleSidebar={() => setSidebarOpen(p => !p)}
        onNewFile={() => handleNewFile(null, 'Untitled')}
        onNewFolder={() => handleNewFolder('New Folder')}
        onSelectFile={handleSelectFile}
      />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Mobile backdrop */}
        {isMobile && sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 20,
            }}
          />
        )}
        <Sidebar
          folders={folders}
          files={files}
          activeFileId={activeFileId}
          open={sidebarOpen}
          isMobile={isMobile}
          onSelectFile={handleSelectFile}
          onNewFile={handleNewFile}
          onNewFolder={handleNewFolder}
          onDeleteFile={handleDeleteFile}
          onDeleteFolder={handleDeleteFolder}
          onRenameFile={handleRenameFile}
          onRenameFolder={handleRenameFolder}
          onReorderFolders={handleReorderFolders}
          onReorderFiles={handleReorderFiles}
          loading={loading}
        />
        <MainPanel
          file={activeFile}
          onSave={handleSaveFile}
          sidebarOpen={sidebarOpen}
        />
      </div>
    </div>
  )
}
