'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { getAdminDbLogsApi } from '@/lib/api/hospital'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Database, HardDrive, Users, RefreshCw, Filter, AlertTriangle } from 'lucide-react'
import type { DbLog } from '@/lib/types'

const fetcher = (filter: string) => getAdminDbLogsApi(filter)

export default function DbLogs() {
  const [filter, setFilter] = useState('all')
  const { data, isLoading, mutate } = useSWR(['admin-logs', filter], () => fetcher(filter), {
    refreshInterval: 10000,
  })

  useEffect(() => {
    const t = setInterval(() => mutate(), 12000)
    return () => clearInterval(t)
  }, [mutate])

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'INSERT': return 'bg-urgency-low/10 text-urgency-low border-urgency-low/30'
      case 'UPDATE': return 'bg-primary/10 text-primary border-primary/30'
      case 'SELECT': return 'bg-muted text-muted-foreground border-border'
      case 'DELETE': return 'bg-destructive/10 text-destructive border-destructive/30'
      case 'ALERT': return 'bg-urgency-high/10 text-urgency-high border-urgency-high/30'
      default: return 'bg-muted text-muted-foreground'
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
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Queries</p>
              <p className="text-2xl font-bold">{data?.stats.queryCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-urgency-moderate/20">
              <HardDrive className="h-6 w-6 text-urgency-moderate" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Storage Used</p>
              <p className="text-2xl font-bold">{data?.stats.storageUsed}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-urgency-low/20">
              <Users className="h-6 w-6 text-urgency-low" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Sessions</p>
              <p className="text-2xl font-bold">{data?.stats.activeSessions}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-urgency-high/20">
              <AlertTriangle className="h-6 w-6 text-urgency-high" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Alerts</p>
              <p className="text-2xl font-bold">{data?.counts.alert}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operation Summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="cursor-pointer hover:border-urgency-low/50 transition-colors" onClick={() => setFilter('INSERT')}>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-urgency-low">{data?.counts.insert}</p>
            <p className="text-sm text-muted-foreground">INSERT</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setFilter('UPDATE')}>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-primary">{data?.counts.update}</p>
            <p className="text-sm text-muted-foreground">UPDATE</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-muted-foreground/50 transition-colors" onClick={() => setFilter('SELECT')}>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{data?.counts.select}</p>
            <p className="text-sm text-muted-foreground">SELECT</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-urgency-high/50 transition-colors" onClick={() => setFilter('ALERT')}>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-urgency-high">{data?.counts.alert}</p>
            <p className="text-sm text-muted-foreground">ALERT</p>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Logs
              </CardTitle>
              <CardDescription>Raw INSERT/UPDATE/SELECT/ALERT entries</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-36">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Operations</SelectItem>
                  <SelectItem value="INSERT">INSERT</SelectItem>
                  <SelectItem value="UPDATE">UPDATE</SelectItem>
                  <SelectItem value="SELECT">SELECT</SelectItem>
                  <SelectItem value="ALERT">ALERT</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => mutate()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Timestamp</th>
                  <th className="pb-3 pr-4 font-medium">Operation</th>
                  <th className="pb-3 pr-4 font-medium">Table</th>
                  <th className="pb-3 pr-4 font-medium">Record ID</th>
                  <th className="pb-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="font-mono text-sm">
                {data?.logs.map((log: DbLog) => (
                  <tr key={log.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString([], {
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant="outline" className={getOperationColor(log.operation)}>
                        {log.operation}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">{log.table_name}</td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {log.record_id ? `${log.record_id.slice(0, 8)}...` : '-'}
                    </td>
                    <td className="py-3 text-muted-foreground max-w-xs truncate">
                      {log.details || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!data?.logs || data.logs.length === 0) && (
              <p className="py-8 text-center text-muted-foreground">No logs found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
