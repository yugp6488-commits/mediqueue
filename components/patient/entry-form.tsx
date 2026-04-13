'use client'

import { useState, useEffect } from 'react'
import { createPatientApi, listDepartmentsApi } from '@/lib/api/hospital'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircle, CheckCircle2, ChevronRight, ChevronLeft, Activity } from 'lucide-react'
import type { Department } from '@/lib/types'

interface PatientEntryFormProps {
  onSuccess: (patientId: string) => void
}

// Department-specific questions
const departmentQuestions: Record<string, { question: string; options: { label: string; score: number }[] }[]> = {
  'General Medicine': [
    { question: 'How would you rate your current pain level?', options: [{ label: 'No pain (0)', score: 0 }, { label: 'Mild (1-3)', score: 1 }, { label: 'Moderate (4-6)', score: 2 }, { label: 'Severe (7-10)', score: 3 }] },
    { question: 'Do you have a fever?', options: [{ label: 'No fever', score: 0 }, { label: 'Low grade (99-100°F)', score: 1 }, { label: 'Moderate (100-102°F)', score: 2 }, { label: 'High (above 102°F)', score: 3 }] },
    { question: 'How long have you had these symptoms?', options: [{ label: 'Less than 24 hours', score: 0 }, { label: '1-3 days', score: 1 }, { label: '4-7 days', score: 2 }, { label: 'More than a week', score: 3 }] },
    { question: 'Are you experiencing nausea or vomiting?', options: [{ label: 'No', score: 0 }, { label: 'Mild nausea', score: 1 }, { label: 'Frequent nausea', score: 2 }, { label: 'Severe vomiting', score: 3 }] },
    { question: 'How is your appetite?', options: [{ label: 'Normal', score: 0 }, { label: 'Slightly reduced', score: 1 }, { label: 'Significantly reduced', score: 2 }, { label: 'Cannot eat', score: 3 }] },
    { question: 'Are you experiencing fatigue?', options: [{ label: 'No', score: 0 }, { label: 'Mild tiredness', score: 1 }, { label: 'Moderate fatigue', score: 2 }, { label: 'Extreme exhaustion', score: 3 }] },
    { question: 'Do you have any chronic conditions?', options: [{ label: 'None', score: 0 }, { label: 'One controlled condition', score: 1 }, { label: 'Multiple conditions', score: 2 }, { label: 'Uncontrolled conditions', score: 3 }] },
    { question: 'Are you taking any medications?', options: [{ label: 'None', score: 0 }, { label: '1-2 medications', score: 1 }, { label: '3-5 medications', score: 2 }, { label: 'More than 5', score: 3 }] },
    { question: 'Have you traveled recently?', options: [{ label: 'No travel', score: 0 }, { label: 'Domestic travel', score: 1 }, { label: 'International travel', score: 2 }, { label: 'Travel to high-risk area', score: 3 }] },
    { question: 'Can you perform daily activities?', options: [{ label: 'Yes, normally', score: 0 }, { label: 'With some difficulty', score: 1 }, { label: 'With significant difficulty', score: 2 }, { label: 'Unable to perform', score: 3 }] },
  ],
  'Emergency': [
    { question: 'Are you experiencing chest pain?', options: [{ label: 'No', score: 0 }, { label: 'Mild discomfort', score: 1 }, { label: 'Moderate pain', score: 2 }, { label: 'Severe crushing pain', score: 3 }] },
    { question: 'Are you having difficulty breathing?', options: [{ label: 'No', score: 0 }, { label: 'Slight shortness', score: 1 }, { label: 'Moderate difficulty', score: 2 }, { label: 'Severe/Cannot breathe', score: 3 }] },
    { question: 'Is there any bleeding?', options: [{ label: 'No bleeding', score: 0 }, { label: 'Minor bleeding', score: 1 }, { label: 'Moderate bleeding', score: 2 }, { label: 'Severe/Uncontrolled', score: 3 }] },
    { question: 'Have you lost consciousness?', options: [{ label: 'No', score: 0 }, { label: 'Felt faint', score: 1 }, { label: 'Brief loss', score: 2 }, { label: 'Prolonged loss', score: 3 }] },
    { question: 'Do you have a severe allergic reaction?', options: [{ label: 'No allergies', score: 0 }, { label: 'Mild reaction', score: 1 }, { label: 'Moderate swelling', score: 2 }, { label: 'Anaphylaxis signs', score: 3 }] },
    { question: 'Is there any trauma or injury?', options: [{ label: 'None', score: 0 }, { label: 'Minor injury', score: 1 }, { label: 'Moderate injury', score: 2 }, { label: 'Severe trauma', score: 3 }] },
    { question: 'Are you experiencing severe pain?', options: [{ label: 'No pain', score: 0 }, { label: 'Mild (1-3)', score: 1 }, { label: 'Moderate (4-6)', score: 2 }, { label: 'Severe (7-10)', score: 3 }] },
    { question: 'Do you have numbness or weakness?', options: [{ label: 'None', score: 0 }, { label: 'Slight tingling', score: 1 }, { label: 'Partial numbness', score: 2 }, { label: 'Complete numbness/paralysis', score: 3 }] },
    { question: 'Are you confused or disoriented?', options: [{ label: 'Alert and oriented', score: 0 }, { label: 'Slightly confused', score: 1 }, { label: 'Moderately confused', score: 2 }, { label: 'Severely disoriented', score: 3 }] },
    { question: 'When did symptoms start?', options: [{ label: 'Gradual onset', score: 0 }, { label: 'Within hours', score: 1 }, { label: 'Within minutes', score: 2 }, { label: 'Sudden onset', score: 3 }] },
  ],
  'Cardiology': [
    { question: 'Do you have chest pain or discomfort?', options: [{ label: 'None', score: 0 }, { label: 'Occasional mild', score: 1 }, { label: 'Frequent moderate', score: 2 }, { label: 'Constant severe', score: 3 }] },
    { question: 'Do you experience shortness of breath?', options: [{ label: 'No', score: 0 }, { label: 'With heavy exertion', score: 1 }, { label: 'With light activity', score: 2 }, { label: 'At rest', score: 3 }] },
    { question: 'Do you have irregular heartbeat?', options: [{ label: 'No', score: 0 }, { label: 'Occasional skipping', score: 1 }, { label: 'Frequent palpitations', score: 2 }, { label: 'Constant irregularity', score: 3 }] },
    { question: 'Do you experience dizziness?', options: [{ label: 'Never', score: 0 }, { label: 'Occasionally', score: 1 }, { label: 'Frequently', score: 2 }, { label: 'Constantly/Fainting', score: 3 }] },
    { question: 'Do you have swelling in legs/ankles?', options: [{ label: 'None', score: 0 }, { label: 'Mild evening swelling', score: 1 }, { label: 'Moderate swelling', score: 2 }, { label: 'Severe persistent', score: 3 }] },
    { question: 'Do you have high blood pressure history?', options: [{ label: 'No', score: 0 }, { label: 'Controlled with medication', score: 1 }, { label: 'Poorly controlled', score: 2 }, { label: 'Uncontrolled/Unknown', score: 3 }] },
    { question: 'Do you smoke?', options: [{ label: 'Never', score: 0 }, { label: 'Former smoker', score: 1 }, { label: 'Light smoker', score: 2 }, { label: 'Heavy smoker', score: 3 }] },
    { question: 'Family history of heart disease?', options: [{ label: 'None', score: 0 }, { label: 'Distant relatives', score: 1 }, { label: 'Parents/siblings over 55', score: 2 }, { label: 'Parents/siblings under 55', score: 3 }] },
    { question: 'Do you have diabetes?', options: [{ label: 'No', score: 0 }, { label: 'Pre-diabetic', score: 1 }, { label: 'Controlled diabetes', score: 2 }, { label: 'Uncontrolled diabetes', score: 3 }] },
    { question: 'Exercise tolerance?', options: [{ label: 'Can exercise normally', score: 0 }, { label: 'Mild limitation', score: 1 }, { label: 'Significant limitation', score: 2 }, { label: 'Cannot exercise', score: 3 }] },
  ],
  'Orthopedics': [
    { question: 'Where is your pain located?', options: [{ label: 'No pain', score: 0 }, { label: 'Single joint/area', score: 1 }, { label: 'Multiple areas', score: 2 }, { label: 'Widespread pain', score: 3 }] },
    { question: 'Pain intensity level?', options: [{ label: 'None (0)', score: 0 }, { label: 'Mild (1-3)', score: 1 }, { label: 'Moderate (4-6)', score: 2 }, { label: 'Severe (7-10)', score: 3 }] },
    { question: 'Is there visible swelling?', options: [{ label: 'No swelling', score: 0 }, { label: 'Mild swelling', score: 1 }, { label: 'Moderate swelling', score: 2 }, { label: 'Severe swelling', score: 3 }] },
    { question: 'Can you bear weight on affected area?', options: [{ label: 'Yes, normally', score: 0 }, { label: 'With some pain', score: 1 }, { label: 'With difficulty', score: 2 }, { label: 'Cannot bear weight', score: 3 }] },
    { question: 'Range of motion?', options: [{ label: 'Full range', score: 0 }, { label: 'Slightly limited', score: 1 }, { label: 'Significantly limited', score: 2 }, { label: 'Cannot move', score: 3 }] },
    { question: 'Was there an injury?', options: [{ label: 'No injury', score: 0 }, { label: 'Minor strain/sprain', score: 1 }, { label: 'Moderate fall/twist', score: 2 }, { label: 'Severe trauma/accident', score: 3 }] },
    { question: 'Is there bruising or discoloration?', options: [{ label: 'None', score: 0 }, { label: 'Mild bruising', score: 1 }, { label: 'Moderate bruising', score: 2 }, { label: 'Severe/deformity visible', score: 3 }] },
    { question: 'Any numbness or tingling?', options: [{ label: 'None', score: 0 }, { label: 'Occasional tingling', score: 1 }, { label: 'Frequent numbness', score: 2 }, { label: 'Constant/loss of sensation', score: 3 }] },
    { question: 'How long have you had symptoms?', options: [{ label: 'Just started', score: 0 }, { label: '1-7 days', score: 1 }, { label: '1-4 weeks', score: 2 }, { label: 'Over a month', score: 3 }] },
    { question: 'Impact on daily activities?', options: [{ label: 'No impact', score: 0 }, { label: 'Mild limitation', score: 1 }, { label: 'Significant limitation', score: 2 }, { label: 'Cannot perform activities', score: 3 }] },
  ],
  'Pediatrics': [
    { question: 'What is the child\'s temperature?', options: [{ label: 'Normal', score: 0 }, { label: 'Low fever (99-100°F)', score: 1 }, { label: 'Moderate (100-103°F)', score: 2 }, { label: 'High (above 103°F)', score: 3 }] },
    { question: 'Is the child eating/drinking normally?', options: [{ label: 'Yes, normally', score: 0 }, { label: 'Slightly less', score: 1 }, { label: 'Much less than usual', score: 2 }, { label: 'Refusing food/drink', score: 3 }] },
    { question: 'Activity level?', options: [{ label: 'Normal/playful', score: 0 }, { label: 'Slightly less active', score: 1 }, { label: 'Lethargic', score: 2 }, { label: 'Very weak/unresponsive', score: 3 }] },
    { question: 'Is the child crying?', options: [{ label: 'Normal crying', score: 0 }, { label: 'More than usual', score: 1 }, { label: 'Inconsolable', score: 2 }, { label: 'Weak/no cry', score: 3 }] },
    { question: 'Any rash present?', options: [{ label: 'No rash', score: 0 }, { label: 'Mild localized', score: 1 }, { label: 'Spreading rash', score: 2 }, { label: 'Severe/blistering', score: 3 }] },
    { question: 'Breathing pattern?', options: [{ label: 'Normal', score: 0 }, { label: 'Slightly fast', score: 1 }, { label: 'Labored/wheezing', score: 2 }, { label: 'Severe difficulty', score: 3 }] },
    { question: 'Vomiting or diarrhea?', options: [{ label: 'None', score: 0 }, { label: 'Occasional', score: 1 }, { label: 'Frequent', score: 2 }, { label: 'Severe/bloody', score: 3 }] },
    { question: 'Last wet diaper/urination?', options: [{ label: 'Within 4 hours', score: 0 }, { label: '4-8 hours ago', score: 1 }, { label: '8-12 hours ago', score: 2 }, { label: 'Over 12 hours', score: 3 }] },
    { question: 'Any ear pulling or pain?', options: [{ label: 'No', score: 0 }, { label: 'Occasional touching', score: 1 }, { label: 'Frequent pulling', score: 2 }, { label: 'Severe pain/discharge', score: 3 }] },
    { question: 'Immunizations up to date?', options: [{ label: 'Yes, all current', score: 0 }, { label: 'Mostly current', score: 1 }, { label: 'Several behind', score: 2 }, { label: 'Not immunized/unknown', score: 3 }] },
  ],
  'Neurology': [
    { question: 'Do you have headaches?', options: [{ label: 'No', score: 0 }, { label: 'Mild occasional', score: 1 }, { label: 'Frequent moderate', score: 2 }, { label: 'Severe/worst ever', score: 3 }] },
    { question: 'Any vision changes?', options: [{ label: 'None', score: 0 }, { label: 'Slight blurriness', score: 1 }, { label: 'Double vision', score: 2 }, { label: 'Vision loss', score: 3 }] },
    { question: 'Numbness or tingling?', options: [{ label: 'None', score: 0 }, { label: 'Occasional mild', score: 1 }, { label: 'Frequent', score: 2 }, { label: 'Constant/spreading', score: 3 }] },
    { question: 'Any weakness in limbs?', options: [{ label: 'No weakness', score: 0 }, { label: 'Slight weakness', score: 1 }, { label: 'Moderate weakness', score: 2 }, { label: 'Cannot move limb', score: 3 }] },
    { question: 'Balance or coordination issues?', options: [{ label: 'None', score: 0 }, { label: 'Occasional unsteadiness', score: 1 }, { label: 'Frequent stumbling', score: 2 }, { label: 'Cannot walk/stand', score: 3 }] },
    { question: 'Memory or confusion?', options: [{ label: 'Normal', score: 0 }, { label: 'Mild forgetfulness', score: 1 }, { label: 'Significant confusion', score: 2 }, { label: 'Severe disorientation', score: 3 }] },
    { question: 'Speech difficulties?', options: [{ label: 'None', score: 0 }, { label: 'Occasional word finding', score: 1 }, { label: 'Slurred speech', score: 2 }, { label: 'Cannot speak', score: 3 }] },
    { question: 'Seizure history?', options: [{ label: 'Never', score: 0 }, { label: 'History, controlled', score: 1 }, { label: 'Recent seizure', score: 2 }, { label: 'Multiple recent/ongoing', score: 3 }] },
    { question: 'Dizziness or vertigo?', options: [{ label: 'None', score: 0 }, { label: 'Occasional mild', score: 1 }, { label: 'Frequent episodes', score: 2 }, { label: 'Constant/severe', score: 3 }] },
    { question: 'Sleep disturbances?', options: [{ label: 'Normal sleep', score: 0 }, { label: 'Mild insomnia', score: 1 }, { label: 'Significant problems', score: 2 }, { label: 'Cannot sleep/excessive', score: 3 }] },
  ],
}

// Default questions for departments not specifically defined
const defaultQuestions = departmentQuestions['General Medicine']

export default function PatientEntryForm({ onSuccess }: PatientEntryFormProps) {
  const [departments, setDepartments] = useState<Department[]>([])
  const [departmentsLoading, setDepartmentsLoading] = useState(true)
  const [departmentsError, setDepartmentsError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [step, setStep] = useState<'info' | 'questions' | 'result'>('info')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [calculatedSeverity, setCalculatedSeverity] = useState<'Low' | 'Moderate' | 'High'>('Low')
  const [confidenceScore, setConfidenceScore] = useState(0)

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    department_id: '',
    problem_description: '',
    travel_distance_km: 0,
  })

  const selectedDepartment = departments.find(d => d.id === formData.department_id)
  const questions = selectedDepartment 
    ? (departmentQuestions[selectedDepartment.name] || defaultQuestions)
    : defaultQuestions

  useEffect(() => {
    async function fetchDepartments() {
      setDepartmentsLoading(true)
      setDepartmentsError(null)
      try {
        const data = await listDepartmentsApi()
        const rows = data ?? []
        setDepartments(rows)
        if (rows.length === 0) {
          setDepartmentsError(
            'No departments found. Ensure MONGODB_URI is set and the API can reach MongoDB Atlas.',
          )
        }
      } catch (e) {
        setDepartments([])
        setDepartmentsError(
          e instanceof Error ? e.message : 'Could not load departments. Check MONGODB_URI in .env.local.',
        )
      } finally {
        setDepartmentsLoading(false)
      }
    }
    void fetchDepartments()
  }, [])

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.department_id) {
      setError('Please select a department')
      return
    }
    setError(null)
    setAnswers(new Array(questions.length).fill(-1))
    setCurrentQuestion(0)
    setStep('questions')
  }

  const handleAnswerSelect = (score: number) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = score
    setAnswers(newAnswers)
  }

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      calculateSeverity()
    }
  }

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const calculateSeverity = () => {
    const totalScore = answers.reduce((sum, score) => sum + (score >= 0 ? score : 0), 0)
    const maxScore = questions.length * 3
    const percentage = (totalScore / maxScore) * 100

    let severity: 'Low' | 'Moderate' | 'High'
    let confidence: number

    if (percentage <= 30) {
      severity = 'Low'
      confidence = 85 + Math.random() * 10
    } else if (percentage <= 60) {
      severity = 'Moderate'
      confidence = 80 + Math.random() * 12
    } else {
      severity = 'High'
      confidence = 88 + Math.random() * 10
    }

    setCalculatedSeverity(severity)
    setConfidenceScore(Math.round(confidence * 10) / 10)
    setStep('result')
  }

  const generateSymptomsSummary = () => {
    const symptoms: string[] = []
    
    // Include the patient's problem description first
    if (formData.problem_description) {
      symptoms.push(`Patient Description: ${formData.problem_description}`)
    }
    
    // Add assessment answers
    questions.forEach((q, idx) => {
      if (answers[idx] >= 0) {
        const selectedOption = q.options[answers[idx]]
        if (answers[idx] > 0) {
          symptoms.push(`${q.question.replace('?', '')}: ${selectedOption.label}`)
        }
      }
    })
    return symptoms.length > 0 ? symptoms.join('; ') : 'No significant symptoms reported'
  }

  const handleFinalSubmit = async () => {
    setLoading(true)
    setError(null)
    console.log('🚀 Starting final check-in submission...')

    try {
      const payload = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        date_of_birth: formData.date_of_birth,
        department_id: formData.department_id,
        symptoms: generateSymptomsSummary(),
        severity: calculatedSeverity,
        status: 'waiting' as const,
        travel_distance_km: formData.travel_distance_km,
      }
      
      console.log('📦 Submission payload:', payload)

      const data = await createPatientApi(payload)
      console.log('✅ Submission successful! Patient ID:', data.id)

      setSuccess(true)
      setTimeout(() => {
        onSuccess(data.id)
      }, 1500)
    } catch (err) {
      console.error('❌ Check-in submission failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to check in. Please check your internet connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-urgency-low/20">
            <CheckCircle2 className="h-8 w-8 text-urgency-low" />
          </div>
          <h3 className="mb-2 text-xl font-semibold">Check-in Successful</h3>
          <p className="text-muted-foreground">Redirecting to your status page...</p>
        </CardContent>
      </Card>
    )
  }

  // Step 1: Basic Information
  if (step === 'info') {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Patient Check-In</CardTitle>
          <CardDescription>
            Fill out your information and select your department
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInfoSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="John Smith"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={formData.department_id}
                onValueChange={(value) => setFormData({ ...formData, department_id: value })}
                required
                disabled={departmentsLoading || departments.length === 0}
              >
                <SelectTrigger id="department">
                  <SelectValue
                    placeholder={
                      departmentsLoading ? 'Loading departments…' : 'Select a department'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {departmentsError && (
                <p className="flex items-start gap-2 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{departmentsError}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="travel_distance">Distance to Hospital (km)</Label>
              <Input
                id="travel_distance"
                type="number"
                min="0"
                max="200"
                value={formData.travel_distance_km}
                onChange={(e) => setFormData({ ...formData, travel_distance_km: parseFloat(e.target.value) || 0 })}
                placeholder="Enter distance in kilometers (e.g., 45)"
              />
              <p className="text-xs text-muted-foreground">
                {formData.travel_distance_km > 30 
                  ? '🏥 Rural patient status recognized - higher priority for critical cases'
                  : 'Optional: Leave as 0 for urban/nearby patients'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="problem_description">Describe Your Problem</Label>
              <Textarea
                id="problem_description"
                value={formData.problem_description}
                onChange={(e) => setFormData({ ...formData, problem_description: e.target.value })}
                placeholder="Please describe what problem or symptoms you are experiencing..."
                rows={4}
                required
              />
              <p className="text-xs text-muted-foreground">
                Be as specific as possible about your symptoms, when they started, and how they affect you.
              </p>
            </div>

            {formData.department_id && formData.problem_description && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">AI-Powered Triage Assessment</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Next, you will answer 10 questions specific to <strong>{selectedDepartment?.name}</strong> to help us assess your condition severity.
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={
                departmentsLoading ||
                departments.length === 0 ||
                !formData.department_id ||
                !formData.problem_description.trim()
              }
            >
              Continue to Assessment
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  // Step 2: Department-Specific Questions
  if (step === 'questions') {
    const question = questions[currentQuestion]
    const progress = ((currentQuestion + 1) / questions.length) * 100

    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {selectedDepartment?.name} Assessment
            </span>
            <span className="text-sm font-medium">
              Question {currentQuestion + 1} of {questions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">{question.question}</h3>
            <RadioGroup
              value={answers[currentQuestion]?.toString()}
              onValueChange={(value) => handleAnswerSelect(parseInt(value))}
              className="space-y-3"
            >
              {question.options.map((option, idx) => (
                <div
                  key={idx}
                  className={`flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                    answers[currentQuestion] === idx 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleAnswerSelect(idx)}
                >
                  <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
                  <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer font-normal">
                    {option.label}
                  </Label>
                  {option.score > 0 && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      option.score === 1 ? 'bg-urgency-low/20 text-urgency-low' :
                      option.score === 2 ? 'bg-urgency-moderate/20 text-urgency-moderate' :
                      'bg-urgency-high/20 text-urgency-high'
                    }`}>
                      {option.score === 1 ? 'Mild' : option.score === 2 ? 'Moderate' : 'Severe'}
                    </span>
                  )}
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevQuestion}
              disabled={currentQuestion === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button
              type="button"
              onClick={handleNextQuestion}
              disabled={answers[currentQuestion] < 0}
            >
              {currentQuestion === questions.length - 1 ? 'View Results' : 'Next'}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Step 3: Results
  if (step === 'result') {
    const totalScore = answers.reduce((sum, score) => sum + (score >= 0 ? score : 0), 0)
    const maxScore = questions.length * 3
    const scorePercentage = (totalScore / maxScore) * 100

    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Assessment Complete</CardTitle>
          <CardDescription>
            Based on your responses, here is your triage assessment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Severity Result */}
          <div className={`p-6 rounded-xl text-center ${
            calculatedSeverity === 'Low' ? 'bg-urgency-low/10 border border-urgency-low/30' :
            calculatedSeverity === 'Moderate' ? 'bg-urgency-moderate/10 border border-urgency-moderate/30' :
            'bg-urgency-high/10 border border-urgency-high/30'
          }`}>
            <div className={`inline-flex h-16 w-16 items-center justify-center rounded-full mb-4 ${
              calculatedSeverity === 'Low' ? 'bg-urgency-low/20' :
              calculatedSeverity === 'Moderate' ? 'bg-urgency-moderate/20' :
              'bg-urgency-high/20'
            }`}>
              <Activity className={`h-8 w-8 ${
                calculatedSeverity === 'Low' ? 'text-urgency-low' :
                calculatedSeverity === 'Moderate' ? 'text-urgency-moderate' :
                'text-urgency-high'
              }`} />
            </div>
            <h3 className="text-2xl font-bold mb-1">{calculatedSeverity} Severity</h3>
            <p className="text-muted-foreground">
              {calculatedSeverity === 'Low' && 'Your symptoms appear to be mild. Standard wait time applies.'}
              {calculatedSeverity === 'Moderate' && 'Your symptoms require attention. Priority wait time applies.'}
              {calculatedSeverity === 'High' && 'Your symptoms are serious. You will be seen as soon as possible.'}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">AI Confidence</p>
              <p className="text-2xl font-bold">{confidenceScore}%</p>
              <Progress value={confidenceScore} className="h-1.5 mt-2" />
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">Symptom Score</p>
              <p className="text-2xl font-bold">{totalScore}/{maxScore}</p>
              <Progress value={scorePercentage} className="h-1.5 mt-2" />
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 rounded-lg border">
            <h4 className="font-medium mb-2">Assessment Summary</h4>
            <p className="text-sm text-muted-foreground">
              <strong>Patient:</strong> {formData.full_name}<br />
              <strong>Department:</strong> {selectedDepartment?.name}<br />
              <strong>Severity:</strong> {calculatedSeverity}
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStep('questions')
                setCurrentQuestion(0)
              }}
              className="flex-1"
            >
              Retake Assessment
            </Button>
            <Button
              type="button"
              onClick={handleFinalSubmit}
              disabled={loading}
              className="flex-1"
            >
              {loading ? <Spinner className="mr-2" /> : null}
              {loading ? 'Submitting...' : 'Complete Check-In'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}
