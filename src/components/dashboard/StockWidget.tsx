const TICKERS = ['SPY', 'VOO', 'VRT', 'SGOV', 'VGT', 'BTC-USD']

interface StockData {
  ticker: string
  price: number
  change: number
  changePct: number
  fiftyTwoWeekHigh?: number
  fiftyTwoWeekLow?: number
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

    const closes = (result.indicators?.quote?.[0]?.close ?? []).filter((c: number | null) => c != null)
    if (closes.length < 2) return null
    const prev = closes[closes.length - 2]
    const current = closes[closes.length - 1]

    const change = current - prev
    const changePct = (change / prev) * 100

    return {
      ticker,
      price: current,
      change,
      changePct,
      fiftyTwoWeekHigh: result.meta?.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: result.meta?.fiftyTwoWeekLow,
    }
  } catch {
    return null
  }
}

export default async function StockWidget() {
  const stocks = await Promise.all(TICKERS.map(fetchStock))

  const cardStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #1a1a24 0%, #16161e 100%)',
    border: '1px solid #2a2a3e',
    borderRadius: '14px',
    padding: '28px',
    position: 'relative',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
  }

  return (
    <div style={cardStyle}>
      <style>{`
        .stock-item {
          padding: 12px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid #2a2a3e;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          transition: all 0.2s ease;
        }
        .stock-item:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: #3a3a4e;
          transform: translateY(-1px);
        }
        .stock-ticker { font-size: 13px; font-weight: 700; color: #e2e8f0; font-family: 'Courier New', monospace; letter-spacing: 0.05em; min-width: 45px; }
        .stock-price { font-size: 14px; font-weight: 600; color: #e2e8f0; }
        .stock-change { font-size: 12px; font-weight: 500; display: flex; align-items: center; gap: 4px; }
        .stock-change.positive { color: #4ade80; }
        .stock-change.negative { color: #f87171; }
      `}</style>

      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#4a4a6a', marginBottom: '20px', fontWeight: '600' }}>
        📈 Watchlist
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {stocks.map((s, i) => {
          const ticker = TICKERS[i]
          if (!s) {
            return (
              <div key={ticker} className="stock-item">
                <span className="stock-ticker">{ticker}</span>
                <span style={{ fontSize: '12px', color: '#4a4a6a', marginLeft: 'auto' }}>—</span>
              </div>
            )
          }
          const positive = s.change >= 0
          const sign = positive ? '▲' : '▼'
          
          return (
            <div key={ticker} className="stock-item">
              <span className="stock-ticker">{ticker}</span>
              <div style={{ marginLeft: 'auto', textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div className="stock-price">${s.price.toFixed(2)}</div>
                <div className={`stock-change ${positive ? 'positive' : 'negative'}`}>
                  <span>{sign}</span>
                  <span>{Math.abs(s.change).toFixed(2)}</span>
                  <span style={{ color: positive ? '#4ade80' : '#f87171', opacity: 0.7 }}>
                    ({positive ? '+' : ''}{s.changePct.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
