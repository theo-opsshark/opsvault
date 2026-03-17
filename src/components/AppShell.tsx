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

  const supabase = createSupabaseBrowserClient()

  const loadData = useCallback(async () => {
    const [{ data: foldersData }, { data: filesData }] = await Promise.all([
      supabase.from('folders').select('*').order('name'),
      supabase.from('files').select('*').order('name'),
    ])
    setFolders(foldersData ?? [])
    setFiles(filesData ?? [])
    setLoading(false)
  }, [])

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
    // Delete all files in folder first
    await supabase.from('files').delete().eq('folder_id', id)
    await supabase.from('folders').delete().eq('id', id)
    setFiles(prev => prev.filter(f => f.folder_id !== id))
    setFolders(prev => prev.filter(f => f.id !== id))
  }

  async function handleRenameFile(id: string, name: string) {
    const { data } = await supabase.from('files').update({ name }).eq('id', id).select().single()
    if (data) setFiles(prev => prev.map(f => f.id === id ? data : f))
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
        onToggleSidebar={() => setSidebarOpen(p => !p)}
        onNewFile={() => handleNewFile(null, 'Untitled')}
        onNewFolder={() => handleNewFolder('New Folder')}
      />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          folders={folders}
          files={files}
          activeFileId={activeFileId}
          open={sidebarOpen}
          onSelectFile={setActiveFileId}
          onNewFile={handleNewFile}
          onNewFolder={handleNewFolder}
          onDeleteFile={handleDeleteFile}
          onDeleteFolder={handleDeleteFolder}
          onRenameFile={handleRenameFile}
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
