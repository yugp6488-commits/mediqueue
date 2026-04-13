import { NextResponse } from 'next/server'
import { findLatestPatientByEmail, getVisitsForPatient } from '@/lib/server/hospital/repository'

export async function GET(request: Request) {
  try {
    const email = new URL(request.url).searchParams.get('email')?.trim().toLowerCase()
    if (!email) {
      return NextResponse.json({ error: 'email required' }, { status: 400 })
    }
    const patient = await findLatestPatientByEmail(email)
    if (!patient) {
      return NextResponse.json(null)
    }
    const visits = await getVisitsForPatient(patient.id)
    return NextResponse.json({ patient, visits })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
