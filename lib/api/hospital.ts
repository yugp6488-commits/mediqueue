import type {
  DbLog,
  Department,
  DepartmentStats,
  Doctor,
  DoctorStats,
  Patient,
  VisitHistory,
} from '@/lib/types'

const prefix = `${process.env.NEXT_PUBLIC_API_URL}/api/hospital`

async function parseError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: unknown }
    if (typeof body.error === 'string') return body.error
    return res.statusText
  } catch {
    return res.statusText
  }
}

async function hospitalFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${prefix}${path}`, {
    ...init,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  if (!res.ok) {
    throw new Error(await parseError(res))
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export function listDepartmentsApi(): Promise<Department[]> {
  return hospitalFetch('/departments')
}

export function createPatientApi(
  body: Pick<
    Patient,
    'full_name' | 'email' | 'phone' | 'date_of_birth' | 'department_id' | 'symptoms' | 'severity' | 'travel_distance_km'
  > & { status?: Patient['status'] },
): Promise<Patient> {
  return hospitalFetch('/patients', { method: 'POST', body: JSON.stringify(body) })
}

export function getPatientQueueApi(patientId: string): Promise<{
  patient: Patient
  queue: (Pick<Patient, 'id' | 'full_name' | 'queue_number' | 'status' | 'severity' | 'check_in_time' | 'travel_distance_km'> & { queue_position?: number })[]
}> {
  return hospitalFetch(`/patients/${encodeURIComponent(patientId)}/queue`)
}

export function getDoctorDashboardApi(): Promise<{
  patients: Patient[]
  doctors: Doctor[]
  metrics: {
    totalToday: number
    completedToday: number
    waitingNow: number
    inProgress: number
  }
}> {
  return hospitalFetch('/doctor-dashboard')
}

export function patchPatientApi(
  id: string,
  body: Partial<Pick<Patient, 'severity' | 'status' | 'doctor_id'>>,
): Promise<Patient> {
  return hospitalFetch(`/patients/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function createVisitHistoryApi(body: {
  patient_id: string
  doctor_id: string
  department_id: string
  visit_date: string
  diagnosis: string | null
  notes: string | null
  prescriptions?: string[] | null
}): Promise<VisitHistory> {
  return hospitalFetch('/visit-history', { method: 'POST', body: JSON.stringify(body) })
}

export function getPatientHistoryApi(
  email: string,
): Promise<{ patient: Patient; visits: VisitHistory[] } | null> {
  return hospitalFetch(`/patient-history?email=${encodeURIComponent(email)}`)
}

export function getAdminDailyRecordsApi(): Promise<{
  departmentStats: DepartmentStats[]
  patients: Patient[]
  metrics: { totalPatients: number; waiting: number; inProgress: number; completed: number }
}> {
  return hospitalFetch('/admin/daily-records')
}

export function getAdminDoctorAvailabilityApi(): Promise<{
  doctors: Doctor[]
  doctorStats: DoctorStats[]
  metrics: { availableCount: number; unavailableCount: number; totalSeen: number; totalQueue: number }
}> {
  return hospitalFetch('/admin/doctor-availability')
}

export function patchDoctorApi(id: string, body: { is_available: boolean }): Promise<{ ok: boolean }> {
  return hospitalFetch(`/doctors/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function getAdminDbLogsApi(filter: string): Promise<{
  logs: DbLog[]
  counts: { insert: number; update: number; select: number; alert: number }
  stats: { storageUsed: string; storageFree: string; activeSessions: number; queryCount: number }
}> {
  const q = filter === 'all' ? '' : `?filter=${encodeURIComponent(filter)}`
  return hospitalFetch(`/admin/db-logs${q}`)
}
