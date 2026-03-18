import { createHmac } from 'crypto'

const KUBERA_BASE_URL = 'https://api.kubera.com'
const KUBERA_API_KEY = 'e21a8755-0792-4107-8920-886ba377d1e4'
const KUBERA_API_SECRET = 's-5a8bd8d044fb4039b2757da930ef26cf'
const PORTFOLIO_ID = 'b0b8f2b3-9a8d-41df-be8f-b326566a05b7'

interface AssetValue {
  amount: number
  currency: string
}

interface Asset {
  name: string
  value: AssetValue
  sectionName: string
  description?: string
}

interface Liability {
  name: string
  value: AssetValue
  sectionName: string
  description?: string
}

interface PortfolioData {
  data: {
    asset: Asset[]
    liability: Liability[]
  }
}

interface CategoryData {
  [key: string]: number
}

interface CacheEntry {
  data: PortfolioData
  timestamp: number
}

// Simple in-memory cache (1-hour TTL)
const cache: Map<string, CacheEntry> = new Map()
const CACHE_TTL = 3600000 // 1 hour in ms

function generateSignature(
  method: string,
  path: string,
  body: string = ''
): { signature: string; timestamp: string } {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const signatureBase = `${KUBERA_API_KEY}${timestamp}${method}${path}${body}`
  const signature = createHmac('sha256', KUBERA_API_SECRET)
    .update(signatureBase)
    .digest('hex')
  return { signature, timestamp }
}

async function fetchPortfolioData(): Promise<PortfolioData | null> {
  // Check cache first
  const cached = cache.get('portfolio')
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  try {
    const path = `/api/v3/data/portfolio/${PORTFOLIO_ID}`
    const method = 'GET'
    const { signature, timestamp } = generateSignature(method, path)

    const res = await fetch(`${KUBERA_BASE_URL}${path}`, {
      method,
      headers: {
        'x-api-token': KUBERA_API_KEY,
        'x-timestamp': timestamp,
        'x-signature': signature,
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      console.error(`Kubera API error: ${res.status}`)
      return null
    }

    const data = await res.json()

    // Cache the result
    cache.set('portfolio', {
      data,
      timestamp: Date.now(),
    })

    return data
  } catch (error) {
    console.error('Kubera fetch error:', error)
    return null
  }
}

function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function getCategoryColor(
  category: string
): { color: string; bgColor: string } {
  const lowerCategory = category.toLowerCase()
  if (lowerCategory.includes('cash') || lowerCategory.includes('savings')) {
    return { color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)' } // green
  } else if (lowerCategory.includes('stock') || lowerCategory.includes('equity')) {
    return { color: '#06b6d4', bgColor: 'rgba(6, 182, 212, 0.1)' } // cyan
  } else if (
    lowerCategory.includes('crypto') ||
    lowerCategory.includes('bitcoin')
  ) {
    return { color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' } // orange
  } else if (lowerCategory.includes('estate') || lowerCategory.includes('property')) {
    return { color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)' } // purple
  }
  return { color: '#64748b', bgColor: 'rgba(100, 116, 139, 0.1)' } // gray
}

function getCategoryEmoji(category: string): string {
  const lowerCategory = category.toLowerCase()
  if (lowerCategory.includes('cash') || lowerCategory.includes('savings')) {
    return '💰'
  } else if (lowerCategory.includes('stock') || lowerCategory.includes('equity')) {
    return '📈'
  } else if (
    lowerCategory.includes('crypto') ||
    lowerCategory.includes('bitcoin')
  ) {
    return '₿'
  } else if (lowerCategory.includes('estate') || lowerCategory.includes('property')) {
    return '🏠'
  }
  return '💼'
}

export default async function KuberaWidget() {
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
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#4a4a6a',
    marginBottom: '20px',
    fontWeight: '600',
  }

  const portfolioData = await fetchPortfolioData()

  if (!portfolioData) {
    return (
      <div style={cardStyle}>
        <div style={labelStyle}>💎 Kubera Portfolio</div>
        <div style={{ color: '#4a4a6a', fontSize: '13px' }}>
          Unable to load portfolio data
        </div>
      </div>
    )
  }

  // Aggregate by section
  const byCategory: CategoryData = {}
  let totalAssets = 0

  portfolioData.data.asset.forEach(asset => {
    const amount = asset.value.amount
    const section = asset.sectionName || 'Other'
    if (!byCategory[section]) {
      byCategory[section] = 0
    }
    byCategory[section] += amount
    totalAssets += amount
  })

  let totalLiabilities = 0
  portfolioData.data.liability.forEach(liability => {
    totalLiabilities += liability.value.amount
  })

  const netWorth = totalAssets - totalLiabilities

  const categories = Object.entries(byCategory)
    .map(([name, value]) => ({
      name,
      value,
      percentage: totalAssets > 0 ? (value / totalAssets * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value)

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
        .metric-icon {
          font-size: 20px;
        }
        .metric-amount {
          font-size: 16px;
          font-weight: 700;
          color: var(--color);
        }
        .metric-label {
          font-size: 10px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .metric-percent {
          font-size: 9px;
          color: #4a4a6a;
        }
      `}</style>

      <div style={labelStyle}>💎 Kubera Portfolio</div>

      {/* Net Worth Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
          border: '1px solid #3b82f6',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '16px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            color: '#93c5fd',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '6px',
          }}
        >
          Net Worth
        </div>
        <div
          style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#e0f2fe',
          }}
        >
          {formatUSD(netWorth)}
        </div>
        {totalLiabilities > 0 && (
          <div
            style={{
              fontSize: '10px',
              color: '#bfdbfe',
              marginTop: '6px',
            }}
          >
            Assets: {formatUSD(totalAssets)} — Liabilities: {formatUSD(totalLiabilities)}
          </div>
        )}
      </div>

      {/* Categories Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: categories.length <= 2 ? '1fr 1fr' : 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
        }}
      >
        {categories.map(cat => {
          const { color, bgColor } = getCategoryColor(cat.name)
          const emoji = getCategoryEmoji(cat.name)
          return (
            <div
              key={cat.name}
              className="metric-card"
              style={{
                '--bg': bgColor,
                '--color': color,
              } as React.CSSProperties}
            >
              <div className="metric-icon">{emoji}</div>
              <div className="metric-amount">{formatUSD(cat.value)}</div>
              <div className="metric-label">{cat.name}</div>
              <div className="metric-percent">{cat.percentage.toFixed(0)}%</div>
            </div>
          )
        })}
      </div>

      {/* Timestamp */}
      <div
        style={{
          fontSize: '9px',
          color: '#4a4a6a',
          marginTop: '12px',
          textAlign: 'center',
        }}
      >
        Updated {new Date().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })}
      </div>
    </div>
  )
}
