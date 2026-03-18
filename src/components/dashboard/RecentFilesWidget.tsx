const SUPABASE_URL = 'https://pxjwajevmuvsbygsmgjy.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4andhamV2bXV2c2J5Z3NtZ2p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NjA4MDMsImV4cCI6MjA4OTMzNjgwM30.WSV7UmU-KyY-GZ6u1-1tcqjABR4RmfGlPqVUcZWLLfA'

interface FileRow {
  id: string
  name: string
  created_at: string
  updated_at: string
  folder_id: string | null
}

interface FolderRow {
  id: string
  name: string
  parent_id: string | null
}

async function fetchRecentFiles(): Promise<{ files: FileRow[]; folders: FolderRow[] }> {
  const [filesRes, foldersRes] = await Promise.all([
    fetch(
      `${SUPABASE_URL}/rest/v1/files?select=id,name,created_at,updated_at,folder_id&order=created_at.desc&limit=5`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        next: { revalidate: 60 },
      }
    ),
    fetch(
      `${SUPABASE_URL}/rest/v1/folders?select=id,name,parent_id`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        next: { revalidate: 60 },
      }
    ),
  ])
  const files = filesRes.ok ? await filesRes.json() : []
  const folders = foldersRes.ok ? await foldersRes.json() : []
  return { files, folders }
}

function buildFolderPath(folderId: string | null, folders: FolderRow[]): string {
  if (!folderId) return 'Root'
  const parts: string[] = []
  let current: string | null = folderId
  while (current) {
    const folder = folders.find(f => f.id === current)
    if (!folder) break
    parts.unshift(folder.name)
    current = folder.parent_id
  }
  return parts.join(' / ') || 'Root'
}

import { IconFile, IconFolder } from './SvgIcons'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default async function RecentFilesWidget() {
  let files: FileRow[] = []
  let folders: FolderRow[] = []
  let error = false

  try {
    const result = await fetchRecentFiles()
    files = result.files
    folders = result.folders
  } catch {
    error = true
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a24 0%, #16161e 100%)',
      border: '1px solid #2a2a3e',
      borderRadius: '14px',
      padding: '16px',
      position: 'relative',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
    }}>
      <style>{`
        .file-row {
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid #2a2a3e;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          transition: all 0.2s ease;
        }
        .file-row:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: #3a3a4e;
          transform: translateY(-1px);
        }
        .file-icon { width: 18px; height: 18px; flex-shrink: 0; color: #64748b; }
        .file-name { font-size: 13px; color: #e2e8f0; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .file-path { font-size: 10px; color: #64748b; margin-top: 2px; }
        .file-time { font-size: 10px; color: #4a4a6a; flex-shrink: 0; font-weight: 500; }
      `}</style>

      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#4a4a6a', marginBottom: '12px', fontWeight: '600' }}>
        📄 Recent Files
      </div>

      {error ? (
        <div style={{ color: '#4a4a6a', fontSize: '13px', padding: '16px', textAlign: 'center' }}>
          Unable to load recent files
        </div>
      ) : files.length === 0 ? (
        <div style={{ color: '#4a4a6a', fontSize: '13px', padding: '16px', textAlign: 'center' }}>
          No files yet
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '10px' }}>
          {files.map((file) => {
            const folderPath = buildFolderPath(file.folder_id, folders)
            const displayName = file.name.replace(/\.md$/, '')
            const timestamp = file.updated_at || file.created_at
            return (
              <div
                key={file.id}
                className="file-row"
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', minWidth: 0, flex: 1 }}>
                  <div className="file-icon"><IconFile /></div>
                  <div style={{ minWidth: 0 }}>
                    <div className="file-name">{displayName}</div>
                    <div className="file-path">{folderPath}</div>
                  </div>
                </div>
                <div className="file-time">{timeAgo(timestamp)}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
