import { NextResponse } from 'next/server'
import { getPatientById, listQueueSlice } from '@/lib/server/hospital/repository'

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params
    const patient = await getPatientById(id)
    if (!patient) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const queue = await listQueueSlice(patient.department_id)
    return NextResponse.json({ patient, queue })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
