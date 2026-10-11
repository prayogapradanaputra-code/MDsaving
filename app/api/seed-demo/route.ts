import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const jobsCount = await query<{ count: number }>('SELECT COUNT(*)::int AS count FROM jobs WHERE user_id = $1', [user.id])
  const assetsCount = await query<{ count: number }>('SELECT COUNT(*)::int AS count FROM assets WHERE user_id = $1', [user.id])
  const presetsCount = await query<{ count: number }>('SELECT COUNT(*)::int AS count FROM presets WHERE user_id = $1', [user.id])

  if (presetsCount[0].count === 0) {
    await query(
      `INSERT INTO presets (user_id, name, mode, quality)
       VALUES
       ($1, 'Client Preview', 'video', 'Creator'),
       ($1, 'Master Archive', 'video', 'Ultra'),
       ($1, 'Podcast Clean', 'audio', 'Audio HQ'),
       ($1, 'Short-form Pack', 'clip', 'Creator')`,
      [user.id]
    )
  }

  if (jobsCount[0].count === 0) {
    await query(
      `INSERT INTO jobs (user_id, title, source, mode, quality, progress, status, poster, completed_at)
       VALUES
       ($1, 'Campaign teaser pack', 'YouTube', 'video', 'Ultra', 76, 'Processing', 'YT', NULL),
       ($1, 'Podcast audio cleanup', 'Audio source', 'audio', 'Audio HQ', 100, 'Complete', 'AU', NOW()),
       ($1, 'Short-form inspiration batch', 'Instagram', 'batch', 'Creator', 34, 'Queued', 'IG', NULL)`,
      [user.id]
    )
  }

  if (assetsCount[0].count === 0) {
    await query(
      `INSERT INTO assets (user_id, title, source, mode, quality, poster)
       VALUES
       ($1, 'Travel Reel Selects', 'Instagram', 'clip', 'Creator', 'IG'),
       ($1, 'Interview Master Export', 'YouTube', 'video', 'Ultra', 'YT'),
       ($1, 'Podcast Clean Audio', 'Audio source', 'audio', 'Audio HQ', 'AU')`,
      [user.id]
    )
  }

  const stats = await query<{
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

  return NextResponse.json({ ok: true, stats: stats[0] })
}
