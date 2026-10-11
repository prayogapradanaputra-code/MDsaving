import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const mode = request.nextUrl.searchParams.get('mode') || 'all'
  const q = (request.nextUrl.searchParams.get('q') || '').toLowerCase()

  const clauses: string[] = ['user_id = $1']
  const params: unknown[] = [user.id]

  if (mode !== 'all') {
    params.push(mode)
    clauses.push(`mode = $${params.length}`)
  }

  if (q) {
    params.push(`%${q}%`)
    clauses.push(`(LOWER(title) LIKE $${params.length} OR LOWER(source) LIKE $${params.length})`)
  }

  const rows = await query(
    `SELECT id, job_id AS "jobId", title, source, mode, quality, poster, created_at AS "createdAt"
     FROM assets
     WHERE ${clauses.join(' AND ')}
     ORDER BY created_at DESC
     LIMIT 40`,
    params
  )

  return NextResponse.json(rows)
}
