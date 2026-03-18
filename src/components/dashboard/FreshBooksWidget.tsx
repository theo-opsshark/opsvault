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
    background: '#16161e',
    border: '1px solid #2a2a3a',
    borderRadius: '12px',
    padding: '20px',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    color: '#4a4a6a',
    marginBottom: '16px',
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

  const outstanding = invoices.filter(i => i.status === 4)
  const draft = invoices.filter(i => i.status === 2)
  const paidThisMonth = invoices.filter(i => {
    if (i.status !== 1 || !i.date_paid) return false
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
      color: outstanding.length > 0 ? '#fbbf24' : '#4a4a6a',
    },
    {
      label: 'Draft',
      count: draft.length,
      amount: null,
      color: '#64748b',
    },
    {
      label: 'Paid this month',
      count: paidThisMonth.length,
      amount: formatUSD(paidTotal),
      color: '#4ade80',
    },
  ]

  return (
    <div style={cardStyle}>
      <div style={labelStyle}>FreshBooks</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {rows.map(row => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>{row.label}</div>
              <div style={{ fontSize: '20px', fontWeight: '600', color: row.color, lineHeight: 1.2 }}>
                {row.count}
                {row.amount && (
                  <span style={{ fontSize: '13px', fontWeight: '400', color: '#64748b', marginLeft: '8px' }}>
                    {row.amount}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
