'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ClipboardList, Radio, History, Sparkles } from 'lucide-react'
import PatientEntryForm from '@/components/patient/entry-form'
import PatientStatus from '@/components/patient/status'
import PatientHistory from '@/components/patient/history'
import AIReport from '@/components/patient/ai-report'

export default function PatientPortal() {
  const [activeTab, setActiveTab] = useState('entry')
  const [currentPatientId, setCurrentPatientId] = useState<string | null>(null)

  const handleCheckInSuccess = (patientId: string) => {
    setCurrentPatientId(patientId)
    setActiveTab('status')
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="mb-6 grid w-full grid-cols-4">
        <TabsTrigger value="entry" className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4" />
          <span className="hidden sm:inline">Check In</span>
        </TabsTrigger>
        <TabsTrigger value="status" className="flex items-center gap-2">
          <Radio className="h-4 w-4" />
          <span className="hidden sm:inline">Live Status</span>
        </TabsTrigger>
        <TabsTrigger value="ai" className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">AI Assistant</span>
        </TabsTrigger>
        <TabsTrigger value="history" className="flex items-center gap-2">
          <History className="h-4 w-4" />
          <span className="hidden sm:inline">History</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="entry">
        <PatientEntryForm onSuccess={handleCheckInSuccess} />
      </TabsContent>

      <TabsContent value="status">
        <PatientStatus patientId={currentPatientId} />
      </TabsContent>

      <TabsContent value="ai">
        <AIReport />
      </TabsContent>

      <TabsContent value="history">
        <PatientHistory />
      </TabsContent>
    </Tabs>
  )
}
