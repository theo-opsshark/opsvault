'use server'

export async function refreshFreshBooksToken() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const FRESHBOOKS_CLIENT_ID = process.env.FRESHBOOKS_CLIENT_ID!
  const FRESHBOOKS_CLIENT_SECRET = process.env.FRESHBOOKS_CLIENT_SECRET!

  try {
    // Get current refresh token from Supabase
    const intRes = await fetch(
      `${SUPABASE_URL}/rest/v1/integrations?service=eq.freshbooks&select=refresh_token,created_at_ts,expires_in`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    )

    if (!intRes.ok) {
      console.error('Failed to fetch integration:', intRes.status)
      return null
    }

    const rows = await intRes.json()
    if (!rows || rows.length === 0) {
      console.error('No FreshBooks integration found')
      return null
    }

    const { refresh_token, created_at_ts, expires_in } = rows[0]

    if (!refresh_token) {
      console.error('No refresh token available')
      return null
    }

    // Call FreshBooks token refresh endpoint
    const tokenRes = await fetch('https://api.freshbooks.com/auth/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: FRESHBOOKS_CLIENT_ID,
        client_secret: FRESHBOOKS_CLIENT_SECRET,
        refresh_token,
      }),
    })

    if (!tokenRes.ok) {
      const err = await tokenRes.text()
      console.error('FreshBooks refresh failed:', err)
      return null
    }

    const newTokens = await tokenRes.json()

    // Update Supabase with new tokens
    const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/integrations?service=eq.freshbooks`, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token,
        expires_in: newTokens.expires_in,
        created_at_ts: Math.floor(Date.now() / 1000),
      }),
    })

    if (!updateRes.ok) {
      console.error('Failed to update token:', updateRes.status)
      return null
    }

    return newTokens.access_token
  } catch (err) {
    console.error('Token refresh error:', err)
    return null
  }
}
