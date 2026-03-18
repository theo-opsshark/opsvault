import { IconSun, IconCloud, IconRain, IconSnow, IconThunder } from './SvgIcons'

function getWeatherDescription(code: number): { label: string; icon: React.ReactNode } {
  if (code === 0) return { label: 'Clear sky', icon: <IconSun /> }
  if (code <= 3) return { label: 'Partly cloudy', icon: <IconCloud /> }
  if (code === 45 || code === 48) return { label: 'Foggy', icon: <IconCloud /> }
  if ([51, 53, 55, 61, 63, 65].includes(code)) return { label: 'Rainy', icon: <IconRain /> }
  if ([71, 73, 75, 77].includes(code)) return { label: 'Snowy', icon: <IconSnow /> }
  if ([80, 81, 82].includes(code)) return { label: 'Showers', icon: <IconRain /> }
  if ([95, 96, 99].includes(code)) return { label: 'Thunderstorm', icon: <IconThunder /> }
  return { label: 'Unknown', icon: <IconCloud /> }
}

async function fetchWeather() {
  const res = await fetch(
    'https://api.open-meteo.com/v1/forecast?latitude=41.4553&longitude=-81.9179&current=temperature_2m,weathercode,windspeed_10m,relative_humidity_2m&daily=weathercode,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=America%2FNew_York',
    { next: { revalidate: 1800 } }
  )
  if (!res.ok) throw new Error('Weather fetch failed')
  return res.json()
}

export default async function WeatherWidget() {
  let data: {
    current: { temperature_2m: number; weathercode: number; windspeed_10m: number; relative_humidity_2m: number }
    daily?: { weathercode: number[]; temperature_2m_max: number[]; temperature_2m_min: number[]; time: string[] }
  } | null = null
  let error = false

  try {
    data = await fetchWeather()
  } catch {
    error = true
  }

  const cardStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #1a1a24 0%, #16161e 100%)',
    border: '1px solid #2a2a3e',
    borderRadius: '14px',
    padding: '16px',
    position: 'relative',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
  }

  if (error || !data) {
    return (
      <div style={cardStyle}>
        <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#4a4a6a', marginBottom: '12px', fontWeight: '600' }}>
          Weather
        </div>
        <div style={{ color: '#4a4a6a', fontSize: '13px' }}>Unable to load weather data</div>
      </div>
    )
  }

  const c = data.current
  const weather = getWeatherDescription(c.weathercode)
  const daily = data.daily

  return (
    <div style={cardStyle}>
      <style>{`
        .weather-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #4a4a6a; font-weight: 600; }
        .weather-temp-huge { font-size: 56px; font-weight: 300; color: #e2e8f0; line-height: 0.9; margin-bottom: 4px; }
        .weather-condition { font-size: 14px; color: #94a3b8; font-weight: 400; display: flex; align-items: center; gap: 6px; }
        .weather-icon { width: 20px; height: 20px; color: #64748b; flex-shrink: 0; }
        .weather-stat-label { font-size: 10px; color: #4a4a6a; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 2px; }
        .weather-stat-value { font-size: 13px; color: #e2e8f0; font-weight: 500; }
        .forecast-pill {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid #2a2a3e;
          border-radius: 8px;
          padding: 8px 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          transition: all 0.2s ease;
        }
        .forecast-pill:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: #3a3a4e;
          transform: translateY(-1px);
        }
      `}</style>

      <div className="weather-label">Weather · Westlake, OH</div>

      {/* Current temp - HUGE */}
      <div style={{ marginBottom: '10px' }}>
        <div className="weather-temp-huge">{Math.round(c.temperature_2m)}°</div>
        <div className="weather-condition">
          <span className="weather-icon">{weather.icon}</span>
          {weather.label}
        </div>
      </div>

      {/* Wind & Humidity - 2 col grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div>
          <div className="weather-stat-label">Wind</div>
          <div className="weather-stat-value">{Math.round(c.windspeed_10m)} mph</div>
        </div>
        <div>
          <div className="weather-stat-label">Humidity</div>
          <div className="weather-stat-value">{c.relative_humidity_2m}%</div>
        </div>
      </div>

      {/* 5-Day Forecast */}
      {daily && daily.time && daily.time.length > 1 && (
        <div style={{ borderTop: '1px solid #2a2a3e', paddingTop: '10px' }}>
          <div className="weather-label" style={{ marginBottom: '8px' }}>
            5-Day Forecast
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {daily.time.slice(1, 6).map((date, idx) => {
              const dayNum = idx + 1
              const weatherCode = daily.weathercode[dayNum]
              const dayWeather = getWeatherDescription(weatherCode)
              const high = Math.round(daily.temperature_2m_max[dayNum])
              const low = Math.round(daily.temperature_2m_min[dayNum])
              const dateObj = new Date(date)
              const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dateObj.getDay()]
              return (
                <div key={date} className="forecast-pill">
                  <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '500', minWidth: '32px' }}>{dayName}</div>
                  <div style={{ width: '18px', height: '18px', color: '#64748b', flex: '0 0 auto' }}>{dayWeather.icon}</div>
                  <div style={{ color: '#e2e8f0', fontSize: '12px', fontWeight: '500', marginLeft: 'auto' }}>
                    {high}° / <span style={{ color: '#64748b' }}>{low}°</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
