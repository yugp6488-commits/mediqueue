'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, Users, Database } from 'lucide-react'
import DailyRecords from '@/components/admin/daily-records'
import DoctorAvailability from '@/components/admin/doctor-availability'
import DbLogs from '@/components/admin/db-logs'

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState('records')

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="mb-6 grid w-full grid-cols-3">
        <TabsTrigger value="records" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          <span className="hidden sm:inline">Daily Records</span>
        </TabsTrigger>
        <TabsTrigger value="doctors" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Doctors</span>
        </TabsTrigger>
        <TabsTrigger value="logs" className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          <span className="hidden sm:inline">DB Logs</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="records">
        <DailyRecords />
      </TabsContent>

      <TabsContent value="doctors">
        <DoctorAvailability />
      </TabsContent>

      <TabsContent value="logs">
        <DbLogs />
      </TabsContent>
    </Tabs>
  )
}
