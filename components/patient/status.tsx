'use client'

import { useState, useEffect } from 'react'
import { getPatientQueueApi } from '@/lib/api/hospital'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Clock, Users, User, Stethoscope, Search, CheckCircle2, AlertCircle, Radio } from 'lucide-react'
import type { Patient, Doctor } from '@/lib/types'

interface PatientStatusProps {
  patientId: string | null
}

export default function PatientStatus({ patientId: initialPatientId }: PatientStatusProps) {
  const [patientId, setPatientId] = useState(initialPatientId || '')
  const [searchInput, setSearchInput] = useState('')
  const [patient, setPatient] = useState<Patient | null>(null)
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [queuePosition, setQueuePosition] = useState<number>(0)
  const [queueTimeline, setQueueTimeline] = useState<Patient[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialPatientId) {
      setPatientId(initialPatientId)
    }
  }, [initialPatientId])

  useEffect(() => {
    if (!patientId) return

    async function fetchStatus() {
      setLoading(true)
      setError(null)

      try {
        const { patient: patientData, queue: queueData } = await getPatientQueueApi(patientId)
        setPatient(patientData)
        if (patientData.doctor_id) {
          setDoctor(patientData.doctor ?? null)
        } else {
          setDoctor(null)
        }
        setQueueTimeline(queueData as any[])
        // Use queue_position from API if available, otherwise calculate from index
        const queueItem = queueData.find((p) => p.id === patientId)
        const position = queueItem?.queue_position ?? (queueData.findIndex((p) => p.id === patientId) + 1)
        setQueuePosition(position)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch status')
      } finally {
        setLoading(false)
      }
    }

    void fetchStatus()

    const interval = setInterval(() => void fetchStatus(), 12000)

    return () => {
      clearInterval(interval)
    }
  }, [patientId])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchInput.trim()) {
      setPatientId(searchInput.trim())
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return 'bg-urgency-high text-white'
      case 'Moderate': return 'bg-urgency-moderate text-white'
      default: return 'bg-urgency-low text-white'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-urgency-low" />
      case 'in_progress': return <Radio className="h-4 w-4 text-primary animate-pulse" />
      default: return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  if (!patientId) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Check Your Status</CardTitle>
          <CardDescription>Enter your patient ID to view your queue position</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patient-id">Patient ID</Label>
              <div className="flex gap-2">
                <Input
                  id="patient-id"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Enter your patient ID"
                />
                <Button type="submit">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    )
  }

  if (loading && !patient) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="flex flex-col items-center py-12">
          <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
          <h3 className="mb-2 text-lg font-semibold">Error</h3>
          <p className="text-muted-foreground">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => setPatientId('')}>
            Try Another ID
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!patient) return null

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Queue Position</p>
              <p className="text-2xl font-bold">
                {patient.status === 'completed' ? 'Done' : `#${queuePosition}`}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-urgency-moderate/20">
              <Clock className="h-6 w-6 text-urgency-moderate" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Est. Wait Time</p>
              <p className="text-2xl font-bold">
                {patient.status === 'in_progress' ? 'Now' : 
                 patient.status === 'completed' ? '-' :
                 `~${(queuePosition - 1) * 15 || 5} min`}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-urgency-low/20">
              <Stethoscope className="h-6 w-6 text-urgency-low" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Assigned Doctor</p>
              <p className="text-lg font-semibold truncate">
                {doctor ? `Dr. ${doctor.name}` : 'Pending'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patient Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                <User className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">{patient.full_name}</CardTitle>
                <CardDescription>Queue #{patient.queue_number}</CardDescription>
              </div>
            </div>
            <Badge className={getSeverityColor(patient.severity)}>
              {patient.severity}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <span className="text-muted-foreground">Department:</span>
              <span className="ml-2 font-medium">{patient.department?.name}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <span className="ml-2 font-medium capitalize">{patient.status.replace('_', ' ')}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Check-in Time:</span>
              <span className="ml-2 font-medium">
                {new Date(patient.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {doctor && (
              <div>
                <span className="text-muted-foreground">Specialty:</span>
                <span className="ml-2 font-medium">{doctor.specialty}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Live Queue Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-primary animate-pulse" />
            Live Queue
          </CardTitle>
          <CardDescription>Real-time view of patients in your department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {queueTimeline.map((p, index) => {
              const isRural = (p.travel_distance_km || 0) > 30
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                    p.id === patientId ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-medium">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {p.id === patientId ? p.full_name : `Patient #${p.queue_number}`}
                        {isRural && (
                          <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded" title={`${p.travel_distance_km}km away`}>
                            🚑 Rural
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Checked in {new Date(p.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isRural && p.travel_distance_km && (
                          <span className="ml-2">• {p.travel_distance_km}km away</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs ${getSeverityColor(p.severity)}`}>
                      {p.severity}
                    </Badge>
                    {getStatusIcon(p.status)}
                  </div>
                </div>
              )
            })}
            {queueTimeline.length === 0 && (
              <p className="py-8 text-center text-muted-foreground">No patients in queue</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
