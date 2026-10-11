import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser, createSession, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const email = String(body.email || '').trim()
  const password = String(body.password || '')

  if (!email || !password) {
    return NextResponse.json({ error: 'Email dan password wajib diisi' }, { status: 400 })
  }

  try {
    const user = await authenticateUser(email, password)
    const token = await createSession(user.id)
    const response = NextResponse.json({ user })
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions())
    return response
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Login failed' }, { status: 401 })
  }
}
