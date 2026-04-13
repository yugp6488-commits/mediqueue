import { NextResponse } from 'next/server'
import { z } from 'zod'
import { updateDoctorAvailability } from '@/lib/server/hospital/repository'

const patchBody = z.object({
  is_available: z.boolean(),
})

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
    const ok = await updateDoctorAvailability(id, parsed.data.is_available)
    if (!ok) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
