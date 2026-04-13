import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getPatientById, updatePatient } from '@/lib/server/hospital/repository'

const patchBody = z.object({
  severity: z.enum(['Low', 'Moderate', 'High']).optional(),
  status: z.enum(['waiting', 'in_progress', 'completed']).optional(),
  doctor_id: z.string().min(1).nullable().optional(),
})

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
    return NextResponse.json(patient)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params
    const json = await request.json()
    const parsed = patchBody.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const patient = await updatePatient(id, parsed.data)
    if (!patient) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(patient)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
