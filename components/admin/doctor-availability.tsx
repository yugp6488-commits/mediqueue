'use client'

import { useEffect } from 'react'
import useSWR from 'swr'
import { getAdminDoctorAvailabilityApi, patchDoctorApi } from '@/lib/api/hospital'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/ui/spinner'
import { Stethoscope, Users, CheckCircle2, Clock } from 'lucide-react'
import type { DoctorStats } from '@/lib/types'

const fetcher = () => getAdminDoctorAvailabilityApi()

export default function DoctorAvailability() {
  const { data, isLoading, mutate } = useSWR('admin-doctors', fetcher, {
    refreshInterval: 15000,
  })

  useEffect(() => {
    const t = setInterval(() => mutate(), 12000)
    return () => clearInterval(t)
  }, [mutate])

  const toggleAvailability = async (doctorId: string, currentAvailability: boolean) => {
    await patchDoctorApi(doctorId, { is_available: !currentAvailability })
    mutate()
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
      {/* Overview Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-urgency-low/20">
              <Stethoscope className="h-6 w-6 text-urgency-low" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Available</p>
              <p className="text-2xl font-bold">{data?.metrics.availableCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Stethoscope className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unavailable</p>
              <p className="text-2xl font-bold">{data?.metrics.unavailableCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Seen</p>
              <p className="text-2xl font-bold">{data?.metrics.totalSeen}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-urgency-moderate/20">
              <Clock className="h-6 w-6 text-urgency-moderate" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">In Queue</p>
              <p className="text-2xl font-bold">{data?.metrics.totalQueue}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Doctor Availability Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Doctor Status
          </CardTitle>
          <CardDescription>Manage doctor availability and view workload</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Doctor</th>
                  <th className="pb-3 pr-4 font-medium">Specialty</th>
                  <th className="pb-3 pr-4 font-medium text-center">Seen Today</th>
                  <th className="pb-3 pr-4 font-medium text-center">In Queue</th>
                  <th className="pb-3 font-medium text-center">Available</th>
                </tr>
              </thead>
              <tbody>
                {data?.doctorStats.map((doc: DoctorStats) => (
                  <tr key={doc.doctor_id} className="border-b last:border-0">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          doc.is_available ? 'bg-urgency-low/20' : 'bg-muted'
                        }`}>
                          <span className={`text-sm font-semibold ${
                            doc.is_available ? 'text-urgency-low' : 'text-muted-foreground'
                          }`}>
                            {doc.doctor_name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="font-medium">Dr. {doc.doctor_name}</span>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <Badge variant="secondary">{doc.specialty}</Badge>
                    </td>
                    <td className="py-4 pr-4 text-center">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-urgency-low/10 text-sm font-medium text-urgency-low">
                        {doc.seen_today}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-center">
                      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                        doc.in_queue > 0 ? 'bg-urgency-moderate/10 text-urgency-moderate' : 'bg-muted text-muted-foreground'
                      }`}>
                        {doc.in_queue}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <Switch
                        checked={doc.is_available}
                        onCheckedChange={() => toggleAvailability(doc.doctor_id, doc.is_available)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!data?.doctorStats || data.doctorStats.length === 0) && (
              <p className="py-8 text-center text-muted-foreground">No doctors found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
