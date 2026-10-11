import { NextRequest, NextResponse } from 'next/server'
import { detectSource } from '@/lib/detect-source'

export async function POST(request: NextRequest) {
  const body = await request.json()
  return NextResponse.json(detectSource(body.url || ''))
}
