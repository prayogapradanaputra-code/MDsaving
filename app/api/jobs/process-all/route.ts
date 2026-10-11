import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const jobs = await query<{
    id: number
    title: string
    source: string
    mode: string
    quality: string
    poster: string
  }>(
    `UPDATE jobs
     SET progress = 100, status = 'Complete', completed_at = NOW()
     WHERE user_id = $1 AND status <> 'Complete'
     RETURNING id, title, source, mode, quality, poster`,
    [user.id]
  )

  for (const job of jobs) {
    await query(
      `INSERT INTO assets (user_id, job_id, title, source, mode, quality, poster, created_at)
       SELECT $1,$2,$3,$4,$5,$6,$7,NOW()
       WHERE NOT EXISTS (SELECT 1 FROM assets WHERE user_id = $1 AND job_id = $2)`,
      [user.id, job.id, job.title, job.source, job.mode, job.quality, job.poster]
    )
  }

  return NextResponse.json({ ok: true, processed: jobs.length })
}
