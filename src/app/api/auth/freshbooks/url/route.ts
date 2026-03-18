import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.FRESHBOOKS_CLIENT_ID!
  const redirectUri = process.env.FRESHBOOKS_REDIRECT_URI!

  const url = `https://my.freshbooks.com/service/auth/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}`

  return NextResponse.json({ url })
}
