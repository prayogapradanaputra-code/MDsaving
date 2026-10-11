import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: 'MDsaving Next.js + PostgreSQL starter',
    timestamp: new Date().toISOString(),
  })
}
