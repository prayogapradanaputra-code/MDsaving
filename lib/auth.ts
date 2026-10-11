import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import type { NextRequest } from 'next/server'
import { query } from '@/lib/db'

const SESSION_COOKIE = 'mdsaving_session'
const SESSION_TTL_DAYS = 14

type UserRow = {
  id: number
  name: string
  email: string
  passwordHash: string
}

export type AuthUser = {
  id: number
  name: string
  email: string
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const derived = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${derived}`
}

export function verifyPassword(password: string, hash: string) {
  const [salt, stored] = hash.split(':')
  if (!salt || !stored) return false

  const derived = scryptSync(password, salt, 64)
  const storedBuffer = Buffer.from(stored, 'hex')

  if (storedBuffer.length !== derived.length) return false

  return timingSafeEqual(storedBuffer, derived)
}

function tokenHash(token: string) {
  return scryptSync(token, 'mdsaving-session', 64).toString('hex')
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * SESSION_TTL_DAYS,
  }
}

export async function createUserAccount(name: string, email: string, password: string) {
  const normalizedEmail = normalizeEmail(email)
  const existing = await query<{ id: number }>('SELECT id FROM users WHERE email = $1 LIMIT 1', [normalizedEmail])

  if (existing[0]) {
    throw new Error('Email already registered')
  }

  const rows = await query<AuthUser>(
    `INSERT INTO users (name, email, password_hash, created_at)
     VALUES ($1,$2,$3,NOW())
     RETURNING id, name, email`,
    [name.trim(), normalizedEmail, hashPassword(password)]
  )

  return rows[0]
}

export async function authenticateUser(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email)
  const rows = await query<UserRow>(
    `SELECT id, name, email, password_hash AS "passwordHash"
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [normalizedEmail]
  )

  const user = rows[0]

  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new Error('Invalid email or password')
  }

  return { id: user.id, name: user.name, email: user.email }
}

export async function createSession(userId: number) {
  const token = randomBytes(32).toString('hex')
  const hashed = tokenHash(token)

  await query(
    `INSERT INTO sessions (user_id, token_hash, expires_at, created_at)
     VALUES ($1,$2,NOW() + INTERVAL '14 days', NOW())`,
    [userId, hashed]
  )

  return token
}

export async function deleteSession(token: string) {
  await query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash(token)])
}

export async function getSessionUser(request: NextRequest): Promise<AuthUser | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (!token) return null

  const rows = await query<AuthUser>(
    `SELECT u.id, u.name, u.email
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > NOW()
     LIMIT 1`,
    [tokenHash(token)]
  )

  return rows[0] || null
}

export { SESSION_COOKIE }
