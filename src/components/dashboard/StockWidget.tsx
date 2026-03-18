const TICKERS = ['SPY', 'VOO', 'VRT', 'SGOV', 'VGT']

interface StockData {
  ticker: string
  price: number
  change: number
  changePct: number
}

async function fetchStock(ticker: string): Promise<StockData | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=2d`,
      {
        next: { revalidate: 300 },
        headers: { 'User-Agent': 'Mozilla/5.0' },
      }
    )
    if (!res.ok) return null
    const json = await res.json()
    const result = json?.chart?.result?.[0]
    if (!result) return null

    const closes = result.indicators?.quote?.[0]?.close ?? []
    const prev = closes[closes.length - 2]
    const current = closes[closes.length - 1]
    if (prev == null || current == null) return null

    const change = current - prev
    const changePct = (change / prev) * 100

    return { ticker, price: current, change, changePct }
  } catch {
    return null
  }
}

export default async function StockWidget() {
  const stocks = await Promise.all(TICKERS.map(fetchStock))

  const cardStyle: React.CSSProperties = {
    background: '#16161e',
    border: '1px solid #2a2a3a',
    borderRadius: '12px',
    padding: '20px',
  }

  return (
    <div style={cardStyle}>
      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#4a4a6a', marginBottom: '16px', fontWeight: '600' }}>
        Watchlist
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {stocks.map((s, i) => {
          const ticker = TICKERS[i]
          if (!s) {
            return (
              <div key={ticker} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', fontFamily: 'monospace' }}>{ticker}</span>
                <span style={{ fontSize: '12px', color: '#4a4a6a' }}>—</span>
              </div>
            )
          }
          const positive = s.change >= 0
          const color = positive ? '#4ade80' : '#f87171'
          const sign = positive ? '+' : ''
          return (
            <div key={ticker} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0', fontFamily: 'monospace', letterSpacing: '0.02em' }}>{ticker}</span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: '500' }}>${s.price.toFixed(2)}</div>
                <div style={{ fontSize: '11px', color }}>
                  {sign}{s.change.toFixed(2)} ({sign}{s.changePct.toFixed(2)}%)
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
