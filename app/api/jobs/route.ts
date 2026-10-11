import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { detectSource } from '@/lib/detect-source'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await query(
    `SELECT id, title, source, mode, quality, progress, status, poster,
            created_at AS "createdAt", completed_at AS "completedAt"
     FROM jobs
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [user.id]
  )

  return NextResponse.json(rows)
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const rawUrl = String(body.url || '').trim()

  if (!rawUrl || rawUrl.length < 4) {
    return NextResponse.json({ error: 'Valid source URL is required' }, { status: 400 })
  }

  const detected = detectSource(rawUrl)
  const mode = body.mode || detected.suggestedMode
  const quality = body.quality || detected.suggestedQuality
  const progress = body.instantSave ? 100 : 8
  const status = body.instantSave ? 'Complete' : 'Queued'

  const created = await query(
    `INSERT INTO jobs (user_id, title, source, mode, quality, progress, status, poster, created_at, completed_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),$9)
     RETURNING id, title, source, mode, quality, progress, status, poster,
               created_at AS "createdAt", completed_at AS "completedAt"`,
    [
      user.id,
      body.title || detected.title,
      detected.platform,
      mode,
      quality,
      progress,
      status,
      detected.poster,
      body.instantSave ? new Date().toISOString() : null,
    ]
  )

  const job = created[0]

  if (body.instantSave) {
    await query(
      `INSERT INTO assets (user_id, job_id, title, source, mode, quality, poster, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
      [user.id, job.id, job.title, job.source, job.mode, job.quality, job.poster]
    )
  }

  return NextResponse.json(job, { status: 201 })
}
