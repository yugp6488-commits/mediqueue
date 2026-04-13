import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createPatient } from '@/lib/server/hospital/repository'

const createBody = z.object({
  full_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  date_of_birth: z.string().min(1),
  department_id: z.string().min(1),
  symptoms: z.string().min(1),
  severity: z.enum(['Low', 'Moderate', 'High']),
  status: z.enum(['waiting', 'in_progress', 'completed']).optional(),
})

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const parsed = createBody.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const patient = await createPatient(parsed.data)
    return NextResponse.json(patient, { status: 201 })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
