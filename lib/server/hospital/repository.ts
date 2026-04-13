import { randomUUID } from 'crypto'
import type { Filter } from 'mongodb'
import { getMongoDb } from '@/lib/mongodb'
import { HOSPITAL_COLLECTIONS as C } from './collections'
import { stripId, toApiJson } from './serialize'
import type { Department, Doctor, Patient, Severity, VisitHistory } from '@/lib/types'

type PatientStatus = Patient['status']
type DbOp = 'INSERT' | 'UPDATE' | 'SELECT' | 'DELETE' | 'ALERT'

function utcDayBounds(): { start: Date; end: Date; dayStr: string } {
  const dayStr = new Date().toISOString().split('T')[0]
  const [y, m, d] = dayStr.split('-').map(Number)
  const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0))
  const end = new Date(Date.UTC(y, m - 1, d + 1, 0, 0, 0, 0))
  return { start, end, dayStr }
}

function severityRank(s: Severity): number {
  if (s === 'High') return 3
  if (s === 'Moderate') return 2
  return 1
}

async function appendLog(
  operation: DbOp,
  table_name: string,
  record_id: string | null,
  details: string | null,
) {
  const db = await getMongoDb()
  await db.collection(C.dbLogs).insertOne({
    _id: randomUUID(),
    operation,
    table_name,
    record_id,
    details,
    created_at: new Date(),
  })
}

export async function seedIfEmpty(): Promise<void> {
  const db = await getMongoDb()
  const deptCol = db.collection(C.departments)
  if ((await deptCol.estimatedDocumentCount()) > 0) return

  const deptNames = [
    'General Medicine',
    'Emergency',
    'Pediatrics',
    'Cardiology',
    'Orthopedics',
    'Neurology',
    'Dermatology',
  ] as const

  const deptIds: Record<string, string> = {}
  for (const name of deptNames) {
    const id = randomUUID()
    deptIds[name] = id
    await deptCol.insertOne({
      _id: id,
      name,
      description: null,
      created_at: new Date(),
    })
  }

  const doctors: {
    name: string
    specialty: string
    dept: (typeof deptNames)[number]
    color: string
    available: boolean
  }[] = [
    { name: 'Sarah Chen', specialty: 'General Practitioner', dept: 'General Medicine', color: 'emerald', available: true },
    { name: 'James Wilson', specialty: 'Emergency Medicine', dept: 'Emergency', color: 'rose', available: true },
    { name: 'Emily Rodriguez', specialty: 'Pediatrician', dept: 'Pediatrics', color: 'amber', available: true },
    { name: 'Michael Park', specialty: 'Cardiologist', dept: 'Cardiology', color: 'sky', available: true },
    { name: 'Lisa Thompson', specialty: 'Orthopedic Surgeon', dept: 'Orthopedics', color: 'violet', available: false },
  ]

  const docCol = db.collection(C.doctors)
  for (const dr of doctors) {
    await docCol.insertOne({
      _id: randomUUID(),
      name: dr.name,
      specialty: dr.specialty,
      department_id: deptIds[dr.dept],
      avatar_color: dr.color,
      is_available: dr.available,
      created_at: new Date(),
    })
  }

  await appendLog('INSERT', 'departments', null, 'Seeded default departments')
  await appendLog('INSERT', 'doctors', null, 'Seeded default doctors')
}

export async function listDepartments(): Promise<Department[]> {
  await seedIfEmpty()
  const db = await getMongoDb()
  const rows = await db
    .collection(C.departments)
    .find({})
    .sort({ name: 1 })
    .toArray()
  return toApiJson(rows.map((r) => stripId(r as { _id: string; name: string; description: string | null })))
}

export async function listDoctorsWithDepartments(): Promise<Doctor[]> {
  await seedIfEmpty()
  const db = await getMongoDb()
  const [deptRows, docRows] = await Promise.all([
    db.collection(C.departments).find({}).toArray(),
    db.collection(C.doctors).find({}).sort({ name: 1 }).toArray(),
  ])
  const deptMap = new Map(
    deptRows.map((d) => {
      const s = stripId(d as { _id: string; name: string; description: string | null })
      return [s.id, { id: s.id, name: s.name, description: s.description } satisfies Department]
    }),
  )
  return docRows.map((raw) => {
    const d = stripId(raw as { _id: string; department_id: string; name: string; specialty: string; avatar_color: string; is_available: boolean })
    const department = deptMap.get(d.department_id)
    return toApiJson({
      id: d.id,
      name: d.name,
      specialty: d.specialty,
      department_id: d.department_id,
      is_available: d.is_available,
      avatar_color: d.avatar_color,
      department,
    })
  })
}

export async function updateDoctorAvailability(id: string, is_available: boolean): Promise<boolean> {
  const db = await getMongoDb()
  const res = await db.collection(C.doctors).updateOne({ _id: id }, { $set: { is_available } })
  if (res.matchedCount) {
    await appendLog('UPDATE', 'doctors', id, `is_available=${is_available}`)
  }
  return res.matchedCount > 0
}

async function nextQueueNumber(): Promise<number> {
  const db = await getMongoDb()
  const { start, end } = utcDayBounds()
  const count = await db.collection(C.patients).countDocuments({
    check_in_time: { $gte: start, $lt: end },
  })
  return count + 1
}

export async function createPatient(input: {
  full_name: string
  email: string
  phone: string
  date_of_birth: string
  department_id: string
  symptoms: string
  severity: Severity
  status?: PatientStatus
}): Promise<Patient> {
  await seedIfEmpty()
  const id = randomUUID()
  const now = new Date()
  const queue_number = await nextQueueNumber()
  const email = input.email.trim().toLowerCase()
  const doc = {
    _id: id,
    full_name: input.full_name,
    email,
    phone: input.phone,
    date_of_birth: input.date_of_birth,
    department_id: input.department_id,
    doctor_id: null as string | null,
    symptoms: input.symptoms,
    severity: input.severity,
    status: (input.status ?? 'waiting') as PatientStatus,
    queue_number,
    check_in_time: now,
    created_at: now,
  }
  const db = await getMongoDb()
  await db.collection(C.patients).insertOne(doc)
  await appendLog('INSERT', 'patients', id, 'Patient check-in')
  return getPatientById(id) as Promise<Patient>
}

export async function getPatientById(id: string): Promise<Patient | null> {
  const db = await getMongoDb()
  const raw = await db.collection(C.patients).findOne({ _id: id })
  if (!raw) return null
  const p = stripId(raw as Record<string, unknown> & { _id: string })
  const [department, doctor] = await Promise.all([
    getDepartmentById(String(p.department_id)),
    p.doctor_id ? getDoctorById(String(p.doctor_id)) : Promise.resolve(null),
  ])
  return toApiJson({
    ...p,
    doctor_id: p.doctor_id ?? null,
    department: department ?? undefined,
    doctor: doctor ?? undefined,
  }) as Patient
}

export async function getDepartmentById(id: string): Promise<Department | null> {
  const db = await getMongoDb()
  const raw = await db.collection(C.departments).findOne({ _id: id })
  if (!raw) return null
  const d = stripId(raw as { _id: string; name: string; description: string | null })
  return toApiJson({ id: d.id, name: d.name, description: d.description })
}

export async function getDoctorById(id: string): Promise<Doctor | null> {
  const db = await getMongoDb()
  const raw = await db.collection(C.doctors).findOne({ _id: id })
  if (!raw) return null
  const d = stripId(raw as { _id: string; name: string; specialty: string; department_id: string; avatar_color: string; is_available: boolean })
  const department = await getDepartmentById(d.department_id)
  return toApiJson({
    id: d.id,
    name: d.name,
    specialty: d.specialty,
    department_id: d.department_id,
    avatar_color: d.avatar_color,
    is_available: d.is_available,
    department: department ?? undefined,
  })
}

export async function updatePatient(
  id: string,
  patch: Partial<{
    severity: Severity
    status: PatientStatus
    doctor_id: string | null
  }>,
): Promise<Patient | null> {
  const db = await getMongoDb()
  const $set: Record<string, unknown> = {}
  if (patch.severity !== undefined) $set.severity = patch.severity
  if (patch.status !== undefined) $set.status = patch.status
  if (patch.doctor_id !== undefined) $set.doctor_id = patch.doctor_id
  if (Object.keys($set).length === 0) return getPatientById(id)
  const res = await db.collection(C.patients).updateOne({ _id: id }, { $set })
  if (!res.matchedCount) return null
  await appendLog('UPDATE', 'patients', id, JSON.stringify(Object.keys($set)))
  return getPatientById(id)
}

export async function listDoctorDashboard(): Promise<{
  patients: Patient[]
  doctors: Doctor[]
  metrics: {
    totalToday: number
    completedToday: number
    waitingNow: number
    inProgress: number
  }
}> {
  await seedIfEmpty()
  const db = await getMongoDb()
  const { start, end } = utcDayBounds()

  const [queuePatients, totalToday, completedToday, waitingNow, inProgress, doctors] = await Promise.all([
    db
      .collection(C.patients)
      .find({ status: { $in: ['waiting', 'in_progress'] } })
      .toArray(),
    db.collection(C.patients).countDocuments({ check_in_time: { $gte: start, $lt: end } }),
    db.collection(C.patients).countDocuments({
      check_in_time: { $gte: start, $lt: end },
      status: 'completed',
    }),
    db.collection(C.patients).countDocuments({ status: 'waiting' }),
    db.collection(C.patients).countDocuments({ status: 'in_progress' }),
    db
      .collection(C.doctors)
      .find({ is_available: true })
      .toArray(),
  ])

  const deptRows = await db.collection(C.departments).find({}).toArray()
  const deptMap = new Map(deptRows.map((r) => [String(r._id), stripId(r as { _id: string; name: string; description: string | null })]))

  const docMap = new Map<string, ReturnType<typeof stripId>>()
  for (const dr of await db.collection(C.doctors).find({}).toArray()) {
    const s = stripId(dr as { _id: string; name: string; specialty: string; department_id: string; avatar_color: string; is_available: boolean })
    docMap.set(s.id, s)
  }

  const sorted = [...queuePatients].sort((a, b) => {
    const ar = severityRank((a as { severity: Severity }).severity)
    const br = severityRank((b as { severity: Severity }).severity)
    if (br !== ar) return br - ar
    return ((a as { queue_number: number }).queue_number || 0) - ((b as { queue_number: number }).queue_number || 0)
  })

  const patients: Patient[] = sorted.map((raw) => {
    const p = stripId(raw as Record<string, unknown> & { _id: string })
    const dept = deptMap.get(String(p.department_id))
    const drId = p.doctor_id ? String(p.doctor_id) : null
    const drDoc = drId ? docMap.get(drId) : undefined
    const department = dept
      ? { id: dept.id, name: dept.name, description: dept.description }
      : undefined
    const doctor = drDoc
      ? {
          id: drDoc.id,
          name: drDoc.name,
          specialty: drDoc.specialty,
          department_id: drDoc.department_id,
          is_available: drDoc.is_available,
          avatar_color: drDoc.avatar_color,
        }
      : undefined
    return toApiJson({ ...p, department, doctor }) as Patient
  })

  const doctorList: Doctor[] = doctors.map((raw) => {
    const d = stripId(raw as { _id: string; department_id: string; name: string; specialty: string; avatar_color: string; is_available: boolean })
    const dept = deptMap.get(d.department_id)
    return toApiJson({
      id: d.id,
      name: d.name,
      specialty: d.specialty,
      department_id: d.department_id,
      is_available: d.is_available,
      avatar_color: d.avatar_color,
      department: dept
        ? { id: dept.id, name: dept.name, description: dept.description }
        : undefined,
    })
  })

  return {
    patients,
    doctors: doctorList,
    metrics: {
      totalToday,
      completedToday,
      waitingNow,
      inProgress,
    },
  }
}

export async function listQueueSlice(departmentId: string): Promise<
  Pick<Patient, 'id' | 'full_name' | 'queue_number' | 'status' | 'severity' | 'check_in_time'>[]
> {
  const db = await getMongoDb()
  const rows = await db
    .collection(C.patients)
    .find({
      department_id: departmentId,
      status: { $in: ['waiting', 'in_progress'] },
    })
    .toArray()

  const sorted = [...rows].sort((a, b) => {
    const ar = severityRank((a as { severity: Severity }).severity)
    const br = severityRank((b as { severity: Severity }).severity)
    if (br !== ar) return br - ar
    return ((a as { queue_number: number }).queue_number || 0) - ((b as { queue_number: number }).queue_number || 0)
  })

  return sorted.map((raw) => {
    const p = stripId(raw as Record<string, unknown> & { _id: string })
    return toApiJson({
      id: p.id,
      full_name: p.full_name,
      queue_number: p.queue_number,
      status: p.status,
      severity: p.severity,
      check_in_time: p.check_in_time,
    })
  })
}

export async function createVisitHistory(input: {
  patient_id: string
  doctor_id: string
  department_id: string
  visit_date: string
  diagnosis: string | null
  notes: string | null
  prescriptions?: string[] | null
}): Promise<VisitHistory> {
  const id = randomUUID()
  const doc = {
    _id: id,
    patient_id: input.patient_id,
    doctor_id: input.doctor_id,
    department_id: input.department_id,
    visit_date: new Date(input.visit_date),
    diagnosis: input.diagnosis,
    prescriptions: input.prescriptions ?? null,
    notes: input.notes,
    created_at: new Date(),
  }
  const db = await getMongoDb()
  await db.collection(C.visitHistory).insertOne(doc)
  await appendLog('INSERT', 'visit_history', id, 'Visit completed')
  const visits = await getVisitsForPatient(input.patient_id)
  const created = visits.find((v) => v.id === id)
  if (!created) {
    throw new Error('Visit record could not be reloaded')
  }
  return created
}

export async function getVisitsForPatient(patientId: string): Promise<VisitHistory[]> {
  const db = await getMongoDb()
  const rows = await db
    .collection(C.visitHistory)
    .find({ patient_id: patientId })
    .sort({ visit_date: -1 })
    .toArray()

  const [doctors, depts] = await Promise.all([listDoctorsWithDepartments(), listDepartments()])
  const docMap = new Map(doctors.map((d) => [d.id, d]))
  const deptMap = new Map(depts.map((d) => [d.id, d]))

  return rows.map((raw) => {
    const v = stripId(raw as Record<string, unknown> & { _id: string })
    return toApiJson({
      ...v,
      doctor: docMap.get(String(v.doctor_id)),
      department: deptMap.get(String(v.department_id)),
    }) as VisitHistory
  })
}

export async function findLatestPatientByEmail(email: string): Promise<Patient | null> {
  const db = await getMongoDb()
  const raw = await db
    .collection(C.patients)
    .find({ email: email.trim().toLowerCase() })
    .sort({ created_at: -1 })
    .limit(1)
    .toArray()
  if (!raw.length) return null
  return getPatientById(String(raw[0]._id))
}

export async function adminDailyRecords(): Promise<{
  departmentStats: import('@/lib/types').DepartmentStats[]
  patients: Patient[]
  metrics: { totalPatients: number; waiting: number; inProgress: number; completed: number }
}> {
  await seedIfEmpty()
  const db = await getMongoDb()
  const { start, end } = utcDayBounds()
  const [departments, patientRows] = await Promise.all([
    listDepartments(),
    db
      .collection(C.patients)
      .find({ check_in_time: { $gte: start, $lt: end } })
      .sort({ check_in_time: -1 })
      .toArray(),
  ])
  const deptMap = new Map(departments.map((d) => [d.id, d]))
  const patients: Patient[] = patientRows.map((raw) => {
    const p = stripId(raw as Record<string, unknown> & { _id: string })
    const dept = deptMap.get(String(p.department_id))
    return toApiJson({ ...p, department: dept }) as Patient
  })

  const departmentStats = departments.map((dept) => {
    const deptPatients = patients.filter((p) => p.department_id === dept.id)
    return {
      department_id: dept.id,
      department_name: dept.name,
      total_patients: deptPatients.length,
      waiting: deptPatients.filter((p) => p.status === 'waiting').length,
      in_progress: deptPatients.filter((p) => p.status === 'in_progress').length,
      completed: deptPatients.filter((p) => p.status === 'completed').length,
    }
  })

  const metrics = {
    totalPatients: patients.length,
    waiting: patients.filter((p) => p.status === 'waiting').length,
    inProgress: patients.filter((p) => p.status === 'in_progress').length,
    completed: patients.filter((p) => p.status === 'completed').length,
  }

  return { departmentStats, patients, metrics }
}

export async function adminDoctorAvailability(): Promise<{
  doctors: Doctor[]
  doctorStats: import('@/lib/types').DoctorStats[]
  metrics: { availableCount: number; unavailableCount: number; totalSeen: number; totalQueue: number }
}> {
  await seedIfEmpty()
  const doctors = await listDoctorsWithDepartments()
  const db = await getMongoDb()
  const { start, end } = utcDayBounds()
  const patientRows = await db
    .collection(C.patients)
    .find({ check_in_time: { $gte: start, $lt: end } })
    .project({ doctor_id: 1, status: 1 })
    .toArray()

  const patients = patientRows as { doctor_id?: string | null; status: string }[]

  const doctorStats = doctors.map((doc) => {
    const docPatients = patients.filter((p) => p.doctor_id === doc.id)
    return {
      doctor_id: doc.id,
      doctor_name: doc.name,
      specialty: doc.specialty,
      is_available: doc.is_available,
      seen_today: docPatients.filter((p) => p.status === 'completed').length,
      in_queue: docPatients.filter((p) => p.status === 'waiting' || p.status === 'in_progress').length,
    }
  })

  const metrics = {
    availableCount: doctors.filter((d) => d.is_available).length,
    unavailableCount: doctors.filter((d) => !d.is_available).length,
    totalSeen: doctorStats.reduce((s, d) => s + d.seen_today, 0),
    totalQueue: doctorStats.reduce((s, d) => s + d.in_queue, 0),
  }

  return { doctors, doctorStats, metrics }
}

export async function adminDbLogs(filter: string): Promise<{
  logs: import('@/lib/types').DbLog[]
  counts: { insert: number; update: number; select: number; alert: number }
  stats: { storageUsed: string; storageFree: string; activeSessions: number; queryCount: number }
}> {
  const db = await getMongoDb()
  const col = db.collection(C.dbLogs)
  const q: Filter<{ operation: string }> =
    filter === 'all' ? {} : { operation: filter as DbOp }

  const [logs, insert, update, select, alert] = await Promise.all([
    col.find(q).sort({ created_at: -1 }).limit(100).toArray(),
    col.countDocuments({ operation: 'INSERT' }),
    col.countDocuments({ operation: 'UPDATE' }),
    col.countDocuments({ operation: 'SELECT' }),
    col.countDocuments({ operation: 'ALERT' }),
  ])

  const mapped = logs.map((raw) => {
    const l = stripId(raw as { _id: string; operation: DbOp; table_name: string; record_id?: string | null; details?: string | null; created_at: Date })
    return toApiJson({
      id: l.id,
      operation: l.operation,
      table_name: l.table_name,
      record_id: l.record_id ?? null,
      details: l.details ?? null,
      created_at: l.created_at,
    })
  })

  return {
    logs: mapped,
    counts: { insert, update, select, alert },
    stats: {
      storageUsed: 'MongoDB Atlas',
      storageFree: '—',
      activeSessions: 0,
      queryCount: insert + update + select,
    },
  }
}
