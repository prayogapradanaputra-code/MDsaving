import { NextRequest, NextResponse } from 'next/server'
import { createSession, createUserAccount, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const name = String(body.name || '').trim()
  const email = String(body.email || '').trim()
  const password = String(body.password || '')

  if (!name || !email || password.length < 6) {
    return NextResponse.json({ error: 'Nama, email, dan password minimal 6 karakter wajib diisi' }, { status: 400 })
  }

  try {
    const user = await createUserAccount(name, email, password)
    const token = await createSession(user.id)
    const response = NextResponse.json({ user }, { status: 201 })
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions())
    return response
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Signup failed' }, { status: 400 })
  }
}
