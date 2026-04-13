import { NextResponse } from 'next/server'
import { listDepartments } from '@/lib/server/hospital/repository'

export async function GET() {
  try {
    const departments = await listDepartments()
    return NextResponse.json(departments)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
