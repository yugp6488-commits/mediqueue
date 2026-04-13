import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createVisitHistory, getVisitsForPatient } from '@/lib/server/hospital/repository'

const postBody = z.object({
  patient_id: z.string().min(1),
  doctor_id: z.string().min(1),
  department_id: z.string().min(1),
  visit_date: z.string(),
  diagnosis: z.string().nullable(),
  notes: z.string().nullable(),
  prescriptions: z.array(z.string()).nullable().optional(),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    if (!patientId) {
      return NextResponse.json({ error: 'patientId required' }, { status: 400 })
    }
    const visits = await getVisitsForPatient(patientId)
    return NextResponse.json(visits)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const parsed = postBody.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const visit = await createVisitHistory(parsed.data)
    return NextResponse.json(visit, { status: 201 })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
