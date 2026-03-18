function getWeatherDescription(code: number): { label: string; emoji: string } {
  if (code === 0) return { label: 'Clear sky', emoji: '☀️' }
  if (code <= 3) return { label: 'Partly cloudy', emoji: '⛅' }
  if (code === 45 || code === 48) return { label: 'Foggy', emoji: '🌫️' }
  if ([51, 53, 55, 61, 63, 65].includes(code)) return { label: 'Rainy', emoji: '🌧️' }
  if ([71, 73, 75, 77].includes(code)) return { label: 'Snowy', emoji: '❄️' }
  if ([80, 81, 82].includes(code)) return { label: 'Showers', emoji: '🌦️' }
  if ([95, 96, 99].includes(code)) return { label: 'Thunderstorm', emoji: '⛈️' }
  return { label: 'Unknown', emoji: '🌡️' }
}

async function fetchWeather() {
  const res = await fetch(
    'https://api.open-meteo.com/v1/forecast?latitude=41.4553&longitude=-81.9179&current=temperature_2m,weathercode,windspeed_10m,relative_humidity_2m&temperature_unit=fahrenheit&windspeed_unit=mph',
    { next: { revalidate: 1800 } }
  )
  if (!res.ok) throw new Error('Weather fetch failed')
  return res.json()
}

export default async function WeatherWidget() {
  let data: { current: { temperature_2m: number; weathercode: number; windspeed_10m: number; relative_humidity_2m: number } } | null = null
  let error = false

  try {
    data = await fetchWeather()
  } catch {
    error = true
  }

  const cardStyle: React.CSSProperties = {
    background: '#16161e',
    border: '1px solid #2a2a3a',
    borderRadius: '12px',
    padding: '20px',
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

  return (
    <div style={cardStyle}>
      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#4a4a6a', marginBottom: '16px', fontWeight: '600' }}>
        Weather · Westlake, OH
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '48px', fontWeight: '300', color: '#e2e8f0', lineHeight: 1, marginBottom: '6px' }}>
            {Math.round(c.temperature_2m)}°
          </div>
          <div style={{ fontSize: '14px', color: '#94a3b8' }}>
            {weather.emoji} {weather.label}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '20px' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Wind</div>
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>{Math.round(c.windspeed_10m)} mph</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Humidity</div>
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>{c.relative_humidity_2m}%</div>
        </div>
      </div>
    </div>
  )
}
