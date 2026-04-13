'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { getPatientHistoryApi } from '@/lib/api/hospital'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Search, Calendar, Pill, FileText, User, AlertCircle } from 'lucide-react'
import type { VisitHistory, Patient } from '@/lib/types'

const fetcher = async (email: string): Promise<{ patient: Patient; visits: VisitHistory[] } | null> => {
  if (!email) return null
  return getPatientHistoryApi(email)
}

export default function PatientHistory() {
  const [email, setEmail] = useState('')
  const [searchEmail, setSearchEmail] = useState('')

  const { data, isLoading, error } = useSWR(
    searchEmail ? ['patient-history', searchEmail] : null,
    () => fetcher(searchEmail)
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchEmail(email.trim())
  }

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Access Your History</CardTitle>
          <CardDescription>Enter your email to view past visits and prescriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <Spinner className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="mx-auto max-w-md">
          <CardContent className="flex flex-col items-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
            <p className="text-muted-foreground">Failed to fetch history</p>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {searchEmail && !isLoading && !data && (
        <Card className="mx-auto max-w-md">
          <CardContent className="flex flex-col items-center py-12">
            <User className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No Records Found</h3>
            <p className="text-center text-muted-foreground">
              No patient records found for this email address
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {data && (
        <div className="space-y-6">
          {/* Patient Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>{data.patient.full_name}</CardTitle>
                  <CardDescription>{data.patient.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 text-sm sm:grid-cols-3">
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="ml-2 font-medium">{data.patient.phone}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Date of Birth:</span>
                  <span className="ml-2 font-medium">
                    {new Date(data.patient.date_of_birth).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Visits:</span>
                  <span className="ml-2 font-medium">{data.visits.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visit History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Visit History
              </CardTitle>
              <CardDescription>Your past visits and prescriptions</CardDescription>
            </CardHeader>
            <CardContent>
              {data.visits.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">No visit history found</p>
              ) : (
                <div className="space-y-4">
                  {data.visits.map((visit) => (
                    <div key={visit.id} className="rounded-lg border p-4">
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <p className="font-semibold">
                            {new Date(visit.visit_date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {visit.department?.name} - Dr. {visit.doctor?.name}
                          </p>
                        </div>
                        <Badge variant="secondary">{visit.department?.name}</Badge>
                      </div>

                      {visit.diagnosis && (
                        <div className="mb-3">
                          <div className="mb-1 flex items-center gap-2 text-sm font-medium">
                            <FileText className="h-4 w-4" />
                            Diagnosis
                          </div>
                          <p className="text-sm text-muted-foreground">{visit.diagnosis}</p>
                        </div>
                      )}

                      {visit.prescriptions && visit.prescriptions.length > 0 && (
                        <div className="mb-3">
                          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                            <Pill className="h-4 w-4" />
                            Prescriptions
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {visit.prescriptions.map((prescription, index) => (
                              <Badge key={index} variant="outline">
                                {prescription}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {visit.notes && (
                        <div>
                          <p className="text-sm italic text-muted-foreground">{visit.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
