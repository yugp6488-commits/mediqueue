export type Severity = 'Low' | 'Moderate' | 'High'

export interface Department {
  id: string
  name: string
  description: string | null
}

export interface Doctor {
  id: string
  name: string
  specialty: string
  department_id: string
  is_available: boolean
  avatar_color: string
  department?: Department
}

export interface Patient {
  id: string
  full_name: string
  email: string
  phone: string
  date_of_birth: string
  department_id: string
  doctor_id: string | null
  symptoms: string
  severity: Severity
  status: 'waiting' | 'in_progress' | 'completed'
  queue_number: number
  check_in_time: string
  created_at: string
  travel_distance_km?: number
  department?: Department
  doctor?: Doctor
}

export interface VisitHistory {
  id: string
  patient_id: string
  doctor_id: string
  department_id: string
  visit_date: string
  diagnosis: string | null
  prescriptions: string[] | null
  notes: string | null
  doctor?: Doctor
  department?: Department
}

export interface DbLog {
  id: string
  operation: 'INSERT' | 'UPDATE' | 'SELECT' | 'DELETE' | 'ALERT'
  table_name: string
  record_id: string | null
  details: string | null
  created_at: string
}

export interface DepartmentStats {
  department_id: string
  department_name: string
  total_patients: number
  waiting: number
  in_progress: number
  completed: number
}

export interface DoctorStats {
  doctor_id: string
  doctor_name: string
  specialty: string
  is_available: boolean
  seen_today: number
  in_queue: number
}
