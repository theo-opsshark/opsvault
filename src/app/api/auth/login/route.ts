import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const PASSWORD = process.env.VAULT_PASSWORD!

export async function POST(req: Request) {
  const { password } = await req.json()
  
  if (password !== PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cookieStore = await cookies()
  cookieStore.set('vault_auth', 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })

  return NextResponse.json({ ok: true })
}
