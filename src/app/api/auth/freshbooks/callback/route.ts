import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error)}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?error=missing_code', request.url));
  }

  const clientId = process.env.FRESHBOOKS_CLIENT_ID;
  const clientSecret = process.env.FRESHBOOKS_CLIENT_SECRET;
  const redirectUri = process.env.FRESHBOOKS_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(new URL('/?error=missing_env_vars', request.url));
  }

  try {
    const tokenResponse = await fetch('https://api.freshbooks.com/auth/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      console.error('FreshBooks token exchange failed:', errorBody);
      return NextResponse.redirect(new URL('/?error=token_exchange_failed', request.url));
    }

    const tokens = await tokenResponse.json();

    // Store tokens in Supabase (persistent across serverless invocations)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    await fetch(`${supabaseUrl}/rest/v1/integrations`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        service: 'freshbooks',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_type: tokens.token_type,
        expires_in: tokens.expires_in,
        created_at_ts: tokens.created_at || Math.floor(Date.now() / 1000),
        scope: tokens.scope,
      }),
    });

    return NextResponse.redirect(new URL('/?freshbooks=connected', request.url));
  } catch (err) {
    console.error('FreshBooks OAuth error:', err);
    return NextResponse.redirect(new URL('/?error=oauth_error', request.url));
  }
}
