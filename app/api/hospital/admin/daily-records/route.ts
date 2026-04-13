import { NextResponse } from 'next/server'
import { adminDailyRecords } from '@/lib/server/hospital/repository'

export async function GET() {
  try {
    const data = await adminDailyRecords()
    return NextResponse.json(data)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
