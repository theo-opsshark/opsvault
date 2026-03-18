const SUPABASE_URL = 'https://pxjwajevmuvsbygsmgjy.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4andhamV2bXV2c2J5Z3NtZ2p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NjA4MDMsImV4cCI6MjA4OTMzNjgwM30.WSV7UmU-KyY-GZ6u1-1tcqjABR4RmfGlPqVUcZWLLfA'
const ACCOUNT_ID = 'MMdp8n'

interface Invoice {
  status: number
  amount: { amount: string }
  date_paid?: string
}

async function getFreshBooksToken(): Promise<string | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/integrations?service=eq.freshbooks&select=access_token&limit=1`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        next: { revalidate: 0 },
      }
    )
    if (!res.ok) return null
    const rows = await res.json()
    return rows?.[0]?.access_token ?? null
  } catch {
    return null
  }
}

async function fetchInvoices(token: string): Promise<Invoice[]> {
  const res = await fetch(
    `https://api.freshbooks.com/accounting/account/${ACCOUNT_ID}/invoices/invoices?per_page=100`,
    {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 300 },
    }
  )
  if (!res.ok) throw new Error(`FreshBooks API error: ${res.status}`)
  const json = await res.json()
  return json?.response?.result?.invoices ?? []
}

function formatUSD(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
}

export default async function FreshBooksWidget() {
  const cardStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #1a1a24 0%, #16161e 100%)',
    border: '1px solid #2a2a3e',
    borderRadius: '14px',
    padding: '28px',
    position: 'relative',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    color: '#4a4a6a',
    marginBottom: '20px',
    fontWeight: '600',
  }

  let token: string | null = null
  let invoices: Invoice[] = []
  let fetchError = false

  try {
    token = await getFreshBooksToken()
    if (token) {
      invoices = await fetchInvoices(token)
    }
  } catch {
    fetchError = true
  }

  if (!token || fetchError) {
    return (
      <div style={cardStyle}>
        <div style={labelStyle}>FreshBooks</div>
        <div style={{ color: '#4a4a6a', fontSize: '13px' }}>
          {!token ? 'No FreshBooks token configured' : 'Unable to load invoice data'}
        </div>
      </div>
    )
  }

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const outstanding = invoices.filter(i => !i.date_paid && i.status !== 2) // unpaid (excludes draft)
  const draft = invoices.filter(i => i.status === 2)
  const paidThisMonth = invoices.filter(i => {
    if (!i.date_paid) return false
    const d = new Date(i.date_paid)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })

  const outstandingTotal = outstanding.reduce((sum, i) => sum + parseFloat(i.amount.amount), 0)
  const paidTotal = paidThisMonth.reduce((sum, i) => sum + parseFloat(i.amount.amount), 0)

  const rows = [
    {
      label: 'Outstanding',
      count: outstanding.length,
      amount: formatUSD(outstandingTotal),
      icon: '📝',
      color: outstanding.length > 0 ? '#fbbf24' : '#4a4a6a',
      bgColor: 'rgba(251, 191, 36, 0.1)',
    },
    {
      label: 'Draft',
      count: draft.length,
      amount: null,
      icon: '✏️',
      color: '#64748b',
      bgColor: 'rgba(100, 116, 139, 0.08)',
    },
    {
      label: 'Paid',
      count: paidThisMonth.length,
      amount: formatUSD(paidTotal),
      icon: '✅',
      color: '#4ade80',
      bgColor: 'rgba(74, 222, 128, 0.1)',
    },
  ]

  return (
    <div style={cardStyle}>
      <style>{`
        .metric-card {
          background: var(--bg);
          border: 1px solid #2a2a3e;
          border-radius: 10px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
        }
        .metric-card:hover {
          border-color: #3a3a4e;
          background: rgba(255, 255, 255, 0.02);
          transform: translateY(-1px);
        }
        .metric-icon { font-size: 20px; }
        .metric-count { font-size: 20px; font-weight: 700; color: var(--color); }
        .metric-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; }
      `}</style>

      <div style={labelStyle}>💼 FreshBooks</div>

      {/* 3-col mini grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
        {rows.map(row => (
          <div
            key={row.label}
            className="metric-card"
            style={{
              '--bg': row.bgColor,
              '--color': row.color,
            } as React.CSSProperties}
          >
            <div className="metric-icon">{row.icon}</div>
            <div className="metric-count">{row.count}</div>
            <div className="metric-label">{row.label}</div>
            {row.amount && (
              <div style={{ fontSize: '10px', color: '#4a4a6a', marginTop: '2px' }}>
                {row.amount}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
