'use client'

import { useEffect } from 'react'
import useSWR from 'swr'
import { getAdminDailyRecordsApi } from '@/lib/api/hospital'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { Building2, Users, Clock, CheckCircle2, Activity } from 'lucide-react'
import type { Patient } from '@/lib/types'

const fetcher = () => getAdminDailyRecordsApi()

export default function DailyRecords() {
  const { data, isLoading, mutate } = useSWR('admin-daily-records', fetcher, {
    refreshInterval: 15000,
  })

  useEffect(() => {
    const t = setInterval(() => mutate(), 12000)
    return () => clearInterval(t)
  }, [mutate])

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-urgency-high text-white'
      case 'moderate': return 'bg-urgency-moderate text-white'
      default: return 'bg-urgency-low text-white'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-urgency-low/10 text-urgency-low'
      case 'in_progress': return 'bg-primary/10 text-primary'
      default: return 'bg-urgency-moderate/10 text-urgency-moderate'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  const maxLoad = Math.max(...(data?.departmentStats.map(d => d.total_patients) || [1]), 1)

  return (
    <div className="space-y-6">
      {/* Overview Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Today</p>
              <p className="text-2xl font-bold">{data?.metrics.totalPatients}</p>
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
              <p className="text-2xl font-bold">{data?.metrics.waiting}</p>
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
              <p className="text-2xl font-bold">{data?.metrics.completed}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Load Bars */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Department Load
          </CardTitle>
          <CardDescription>Patient distribution across departments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data?.departmentStats.map((dept) => (
              <div key={dept.department_id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{dept.department_name}</span>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-urgency-moderate">{dept.waiting} waiting</span>
                    <span className="text-primary">{dept.in_progress} active</span>
                    <span className="text-urgency-low">{dept.completed} done</span>
                  </div>
                </div>
                <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-secondary">
                  <div 
                    className="bg-urgency-moderate transition-all duration-500"
                    style={{ width: `${(dept.waiting / maxLoad) * 100}%` }}
                  />
                  <div 
                    className="bg-primary transition-all duration-500"
                    style={{ width: `${(dept.in_progress / maxLoad) * 100}%` }}
                  />
                  <div 
                    className="bg-urgency-low transition-all duration-500"
                    style={{ width: `${(dept.completed / maxLoad) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live Registrations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary animate-pulse" />
            Live Registrations
          </CardTitle>
          <CardDescription>Real-time patient check-ins today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Queue #</th>
                  <th className="pb-3 pr-4 font-medium">Patient</th>
                  <th className="pb-3 pr-4 font-medium">Department</th>
                  <th className="pb-3 pr-4 font-medium">Urgency</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 font-medium">Check-in</th>
                </tr>
              </thead>
              <tbody>
                {data?.patients.slice(0, 15).map((patient: Patient) => (
                  <tr key={patient.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-mono text-sm">#{patient.queue_number}</td>
                    <td className="py-3 pr-4 font-medium">{patient.full_name}</td>
                    <td className="py-3 pr-4 text-sm">{patient.department?.name}</td>
                    <td className="py-3 pr-4">
                      <Badge className={`text-xs ${getUrgencyColor(patient.severity.toLowerCase())}`}>
                        {patient.severity}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant="secondary" className={`text-xs ${getStatusColor(patient.status)}`}>
                        {patient.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-3 text-sm text-muted-foreground">
                      {new Date(patient.check_in_time).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!data?.patients || data.patients.length === 0) && (
              <p className="py-8 text-center text-muted-foreground">No registrations today</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
