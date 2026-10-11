import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await query(
    'SELECT id, name, mode, quality, created_at AS "createdAt" FROM presets WHERE user_id = $1 ORDER BY created_at DESC',
    [user.id]
  )
  return NextResponse.json(rows)
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const name = String(body.name || '').trim()

  if (!name) {
    return NextResponse.json({ error: 'Preset name is required' }, { status: 400 })
  }

  const rows = await query(
    `INSERT INTO presets (user_id, name, mode, quality, created_at)
     VALUES ($1,$2,$3,$4,NOW())
     RETURNING id, name, mode, quality, created_at AS "createdAt"`,
    [user.id, name, body.mode || 'video', body.quality || 'Creator']
  )

  return NextResponse.json(rows[0], { status: 201 })
}
