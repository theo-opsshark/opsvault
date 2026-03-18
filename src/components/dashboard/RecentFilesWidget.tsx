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
      background: '#16161e',
      border: '1px solid #2a2a3a',
      borderRadius: '12px',
      padding: '20px',
    }}>
      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#4a4a6a', marginBottom: '16px', fontWeight: '600' }}>
        Recent Files
      </div>

      {error ? (
        <div style={{ color: '#4a4a6a', fontSize: '13px' }}>Unable to load recent files</div>
      ) : files.length === 0 ? (
        <div style={{ color: '#4a4a6a', fontSize: '13px' }}>No files yet</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {files.map((file, i) => {
            const folderPath = buildFolderPath(file.folder_id, folders)
            const displayName = file.name.replace(/\.md$/, '')
            const timestamp = file.updated_at || file.created_at
            return (
              <div
                key={file.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: i % 2 === 0 ? '#1a1a24' : 'transparent',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {displayName}
                    </div>
                    <div style={{ fontSize: '11px', color: '#4a4a6a', marginTop: '1px' }}>
                      {folderPath}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: '#4a4a6a', flexShrink: 0 }}>
                  {timeAgo(timestamp)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
