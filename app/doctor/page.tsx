'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import {
  createVisitHistoryApi,
  getDoctorDashboardApi,
  patchPatientApi,
} from '@/lib/api/hospital'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  Activity,
  Eye,
  Phone,
  Search,
  Filter,
  AlertTriangle,
  Heart,
  Thermometer,
  Gauge
} from 'lucide-react'
import type { Patient, Doctor, Severity } from '@/lib/types'

const fetcher = () => getDoctorDashboardApi()

export default function DoctorPortal() {
  const { data, isLoading, mutate } = useSWR('doctor-dashboard', fetcher, {
    refreshInterval: 10000,
  })
  
  const [searchTerm, setSearchTerm] = useState('')
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    const t = setInterval(() => mutate(), 8000)
    return () => clearInterval(t)
  }, [mutate])

  const filteredPatients = data?.patients.filter((patient: Patient) => {
    const matchesSearch = patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          patient.queue_number.toString().includes(searchTerm)
    const matchesSeverity = urgencyFilter === 'all' || patient.severity === urgencyFilter
    return matchesSearch && matchesSeverity
  }) || []

  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    setIsDialogOpen(true)
  }

  const handleSeverityOverride = async (newSeverity: Severity) => {
    if (!selectedPatient) return
    setActionLoading(true)
    
    await patchPatientApi(selectedPatient.id, { severity: newSeverity })
    
    setSelectedPatient({ ...selectedPatient, severity: newSeverity })
    setActionLoading(false)
    mutate()
  }

  const handleCallPatientIn = async () => {
    if (!selectedPatient) return
    setActionLoading(true)
    
    const newStatus = selectedPatient.status === 'waiting' ? 'in_progress' : 'completed'
    const doctorId = selectedPatient.doctor_id || data?.doctors[0]?.id || null

    await patchPatientApi(selectedPatient.id, {
      status: newStatus,
      doctor_id: doctorId,
    })

    if (newStatus === 'completed' && doctorId) {
      await createVisitHistoryApi({
        patient_id: selectedPatient.id,
        doctor_id: doctorId,
        department_id: selectedPatient.department_id,
        visit_date: new Date().toISOString(),
        diagnosis: 'Consultation completed',
        notes: `Symptoms: ${selectedPatient.symptoms}`,
      })
    }
    
    setActionLoading(false)
    setIsDialogOpen(false)
    mutate()
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return 'bg-urgency-high text-white'
      case 'Moderate': return 'bg-urgency-moderate text-white'
      default: return 'bg-urgency-low text-white'
    }
  }

  const getAvatarColor = (severity: string) => {
    switch (severity) {
      case 'High': return 'bg-urgency-high/20 text-urgency-high border-urgency-high/30'
      case 'Moderate': return 'bg-urgency-moderate/20 text-urgency-moderate border-urgency-moderate/30'
      default: return 'bg-urgency-low/20 text-urgency-low border-urgency-low/30'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Today</p>
              <p className="text-2xl font-bold">{data?.metrics.totalToday}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-urgency-moderate/20">
              <Clock className="h-6 w-6 text-urgency-moderate" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Waiting</p>
              <p className="text-2xl font-bold">{data?.metrics.waitingNow}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold">{data?.metrics.inProgress}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-urgency-low/20">
              <CheckCircle2 className="h-6 w-6 text-urgency-low" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{data?.metrics.completedToday}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patient Queue */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Patient Queue</CardTitle>
              <CardDescription>Click View to see patient details</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                <SelectTrigger className="w-36">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Moderate">Moderate</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredPatients.map((patient: Patient) => (
              <div
                key={patient.id}
                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent/50"
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${getAvatarColor(patient.severity)}`}>
                    <span className="text-sm font-semibold">
                      {patient.full_name.split(' ').map((n: string) => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{patient.full_name}</p>
                      <Badge className={`text-xs ${getSeverityColor(patient.severity)}`}>
                        {patient.severity}
                      </Badge>
                      {patient.status === 'in_progress' && (
                        <Badge variant="outline" className="text-xs">
                          In Progress
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Queue #{patient.queue_number} • {patient.department?.name}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleViewPatient(patient)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Button>
              </div>
            ))}
            {filteredPatients.length === 0 && (
              <p className="py-8 text-center text-muted-foreground">No patients in queue</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Patient Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedPatient && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full border-2 ${getAvatarColor(selectedPatient.severity)}`}>
                    <span className="font-semibold">
                      {selectedPatient.full_name.split(' ').map((n: string) => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <DialogTitle>{selectedPatient.full_name}</DialogTitle>
                    <DialogDescription>
                      Queue #{selectedPatient.queue_number} • {selectedPatient.department?.name}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                {/* Vitals */}
                {selectedPatient.vitals && (
                  <div>
                    <h4 className="mb-3 text-sm font-semibold text-muted-foreground">Vitals</h4>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="flex items-center gap-3 rounded-lg border p-3">
                        <Heart className="h-5 w-5 text-urgency-high" />
                        <div>
                          <p className="text-xs text-muted-foreground">Blood Pressure</p>
                          <p className="font-medium">{selectedPatient.vitals.blood_pressure || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-lg border p-3">
                        <Activity className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Heart Rate</p>
                          <p className="font-medium">{selectedPatient.vitals.heart_rate || 'N/A'} bpm</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-lg border p-3">
                        <Thermometer className="h-5 w-5 text-urgency-moderate" />
                        <div>
                          <p className="text-xs text-muted-foreground">Temperature</p>
                          <p className="font-medium">{selectedPatient.vitals.temperature || 'N/A'}°F</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Complaint */}
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Chief Complaint</h4>
                  <p className="rounded-lg bg-secondary p-3 text-sm">{selectedPatient.symptoms}</p>
                </div>

                {/* Medical History */}
                {selectedPatient.medical_history && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Known History</h4>
                    <p className="rounded-lg bg-secondary p-3 text-sm">{selectedPatient.medical_history}</p>
                  </div>
                )}

                {/* Severity Override */}
                <div>
                  <Label className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <AlertTriangle className="h-4 w-4" />
                    Severity Override
                  </Label>
                  <div className="flex gap-2">
                    {(['Low', 'Moderate', 'High'] as Severity[]).map((severity) => (
                      <Button
                        key={severity}
                        variant={selectedPatient.severity === severity ? 'default' : 'outline'}
                        size="sm"
                        className={selectedPatient.severity === severity ? getSeverityColor(severity) : ''}
                        onClick={() => handleSeverityOverride(severity)}
                        disabled={actionLoading}
                      >
                        {severity}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={handleCallPatientIn} disabled={actionLoading}>
                  {actionLoading ? <Spinner className="mr-2" /> : <Phone className="mr-2 h-4 w-4" />}
                  {selectedPatient.status === 'waiting' ? 'Call Patient In' : 'Mark Complete'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
