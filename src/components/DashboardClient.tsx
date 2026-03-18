'use client'

import { useState, useEffect, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import type { Folder, VaultFile } from '@/lib/supabase'
import AppNav from './AppNav'

interface Props {
  children: React.ReactNode
}

export default function DashboardClient({ children }: Props) {
  const [user, setUser] = useState<User | null>(null)
  const [folders, setFolders] = useState<Folder[]>([])
  const [files, setFiles] = useState<VaultFile[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('opsvault-sidebar-width')
      if (saved) return Math.max(180, Math.min(480, parseInt(saved, 10)))
    }
    return 260
  })

  const supabase = createSupabaseBrowserClient()

  // Get current user
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

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

  // Load folder/file data for navigation
  const loadData = useCallback(async () => {
    const [{ data: foldersData }, { data: filesData }] = await Promise.all([
      supabase.from('folders').select('*').order('created_at', { ascending: true }),
      supabase.from('files').select('*').order('created_at', { ascending: true }),
    ])
    
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
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        background: '#0f0f13',
        overflow: 'hidden',
      }}
    >
      <AppNav
        user={user}
        folders={folders}
        files={files}
        activeFileId={null}
        sidebarOpen={sidebarOpen}
        isMobile={isMobile}
        sidebarWidth={sidebarWidth}
        onToggleSidebar={() => setSidebarOpen(p => !p)}
        onSidebarWidthChange={(w) => {
          setSidebarWidth(w)
          localStorage.setItem('opsvault-sidebar-width', String(w))
        }}
        onSelectFile={() => {}}
      />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  )
}
