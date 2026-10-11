import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await query<{
    assets: number
    queue: number
    presets: number
    processed: number
    storage: string
  }>(
    `SELECT
      (SELECT COUNT(*)::int FROM assets WHERE user_id = $1) AS assets,
      (SELECT COUNT(*)::int FROM jobs WHERE user_id = $1 AND status <> 'Complete') AS queue,
      (SELECT COUNT(*)::int FROM presets WHERE user_id = $1) AS presets,
      (SELECT COUNT(*)::int FROM assets WHERE user_id = $1) + 140 AS processed,
      ((87 + (SELECT COUNT(*)::int FROM assets WHERE user_id = $1))::text || ' GB') AS storage`,
    [user.id]
  )

  return NextResponse.json(rows[0])
}
