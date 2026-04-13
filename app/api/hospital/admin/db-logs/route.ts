import { NextResponse } from 'next/server'
import { adminDbLogs } from '@/lib/server/hospital/repository'

export async function GET(request: Request) {
  try {
    const filter = new URL(request.url).searchParams.get('filter') || 'all'
    const data = await adminDbLogs(filter)
    return NextResponse.json(data)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
