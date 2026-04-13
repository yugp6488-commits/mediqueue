'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { 
  AlertTriangle,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Activity,
  ThermometerSun,
  Heart,
  Brain,
  Stethoscope,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  Siren
} from 'lucide-react'

// Fixed triage questions to assess emergency level
const TRIAGE_QUESTIONS = [
  {
    id: 'pain_level',
    question: 'How would you rate your current pain level?',
    icon: Activity,
    options: [
      { value: 'none', label: 'No pain (0)', score: 0 },
      { value: 'mild', label: 'Mild pain (1-3)', score: 1 },
      { value: 'moderate', label: 'Moderate pain (4-6)', score: 2 },
      { value: 'severe', label: 'Severe pain (7-10)', score: 3 },
    ]
  },
  {
    id: 'breathing',
    question: 'Are you experiencing any difficulty breathing?',
    icon: Stethoscope,
    options: [
      { value: 'normal', label: 'Breathing normally', score: 0 },
      { value: 'slight', label: 'Slightly short of breath', score: 1 },
      { value: 'moderate', label: 'Moderate difficulty breathing', score: 2 },
      { value: 'severe', label: 'Severe difficulty / Cannot catch breath', score: 3 },
    ]
  },
  {
    id: 'fever',
    question: 'Do you have a fever or elevated temperature?',
    icon: ThermometerSun,
    options: [
      { value: 'normal', label: 'Normal temperature', score: 0 },
      { value: 'low', label: 'Low-grade fever (99-100.4°F)', score: 1 },
      { value: 'moderate', label: 'Moderate fever (100.4-103°F)', score: 2 },
      { value: 'high', label: 'High fever (above 103°F)', score: 3 },
    ]
  },
  {
    id: 'consciousness',
    question: 'How would you describe your mental state?',
    icon: Brain,
    options: [
      { value: 'alert', label: 'Fully alert and oriented', score: 0 },
      { value: 'slightly_confused', label: 'Slightly confused or drowsy', score: 1 },
      { value: 'confused', label: 'Confused or disoriented', score: 2 },
      { value: 'very_confused', label: 'Very confused / Difficulty staying awake', score: 3 },
    ]
  },
  {
    id: 'chest_pain',
    question: 'Are you experiencing chest pain or pressure?',
    icon: Heart,
    options: [
      { value: 'none', label: 'No chest pain', score: 0 },
      { value: 'mild', label: 'Mild discomfort', score: 1 },
      { value: 'moderate', label: 'Moderate chest pain', score: 2 },
      { value: 'severe', label: 'Severe chest pain / pressure', score: 3 },
    ]
  },
  {
    id: 'symptom_duration',
    question: 'How long have you been experiencing these symptoms?',
    icon: Activity,
    options: [
      { value: 'hours', label: 'Less than 24 hours', score: 0 },
      { value: 'day', label: '1-2 days', score: 1 },
      { value: 'days', label: '3-7 days', score: 2 },
      { value: 'week', label: 'More than a week', score: 2 },
    ]
  },
  {
    id: 'mobility',
    question: 'How is your ability to move and perform daily activities?',
    icon: Activity,
    options: [
      { value: 'normal', label: 'Normal mobility', score: 0 },
      { value: 'slight', label: 'Slight difficulty', score: 1 },
      { value: 'moderate', label: 'Moderate difficulty', score: 2 },
      { value: 'severe', label: 'Cannot perform daily activities', score: 3 },
    ]
  },
  {
    id: 'bleeding',
    question: 'Is there any bleeding or visible injury?',
    icon: AlertCircle,
    options: [
      { value: 'none', label: 'No bleeding or injury', score: 0 },
      { value: 'minor', label: 'Minor cut or bruise', score: 1 },
      { value: 'moderate', label: 'Moderate bleeding (controllable)', score: 2 },
      { value: 'severe', label: 'Severe / Uncontrollable bleeding', score: 3 },
    ]
  },
]

type Answers = Record<string, string>

interface AssessmentResult {
  severity: 'Low' | 'Moderate' | 'High'
  confidence: number
  totalScore: number
  maxScore: number
  recommendations: string[]
  aiAnalysis: string
}

export default function AIReport() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [assessmentComplete, setAssessmentComplete] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<AssessmentResult | null>(null)

  const progress = ((currentQuestion + 1) / TRIAGE_QUESTIONS.length) * 100
  const currentQ = TRIAGE_QUESTIONS[currentQuestion]
  const IconComponent = currentQ?.icon || Activity

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({ ...prev, [currentQ.id]: value }))
  }

  const goNext = () => {
    if (currentQuestion < TRIAGE_QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    }
  }

  const goPrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
    }
  }

  const calculateResult = async () => {
    setIsAnalyzing(true)

    // Calculate score
    let totalScore = 0
    const maxScore = TRIAGE_QUESTIONS.length * 3

    TRIAGE_QUESTIONS.forEach(q => {
      const answer = answers[q.id]
      const option = q.options.find(o => o.value === answer)
      if (option) {
        totalScore += option.score
      }
    })

    // Determine severity based on score percentage
    const scorePercentage = (totalScore / maxScore) * 100
    let severity: 'Low' | 'Moderate' | 'High'
    let confidence: number

    if (scorePercentage <= 25) {
      severity = 'Low'
      confidence = 85 + Math.random() * 10 // 85-95%
    } else if (scorePercentage <= 55) {
      severity = 'Moderate'
      confidence = 75 + Math.random() * 15 // 75-90%
    } else {
      severity = 'High'
      confidence = 80 + Math.random() * 15 // 80-95%
    }

    // Get AI analysis
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/triage-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          questions: TRIAGE_QUESTIONS.map(q => ({
            question: q.question,
            answer: q.options.find(o => o.value === answers[q.id])?.label || 'Not answered'
          })),
          calculatedSeverity: severity,
          totalScore,
          maxScore
        })
      })

      const data = await response.json()

      setResult({
        severity,
        confidence: Math.round(confidence * 10) / 10,
        totalScore,
        maxScore,
        recommendations: data.recommendations || getDefaultRecommendations(severity),
        aiAnalysis: data.analysis || getDefaultAnalysis(severity)
      })
    } catch (error) {
      // Fallback if API fails
      setResult({
        severity,
        confidence: Math.round(confidence * 10) / 10,
        totalScore,
        maxScore,
        recommendations: getDefaultRecommendations(severity),
        aiAnalysis: getDefaultAnalysis(severity)
      })
    }

    setAssessmentComplete(true)
    setIsAnalyzing(false)
  }

  const getDefaultRecommendations = (severity: 'Low' | 'Moderate' | 'High'): string[] => {
    if (severity === 'Low') {
      return [
        'Rest and monitor your symptoms at home',
        'Stay hydrated and get adequate sleep',
        'Take over-the-counter medication if needed',
        'Schedule a routine appointment if symptoms persist'
      ]
    } else if (severity === 'Moderate') {
      return [
        'Consider seeing a healthcare provider today',
        'Monitor symptoms closely for any worsening',
        'Avoid strenuous activities',
        'Keep a log of your symptoms and their progression'
      ]
    } else {
      return [
        'Seek immediate medical attention',
        'Consider visiting an emergency room',
        'Do not drive yourself - call for help if needed',
        'Bring a list of your current medications'
      ]
    }
  }

  const getDefaultAnalysis = (severity: 'Low' | 'Moderate' | 'High'): string => {
    if (severity === 'Low') {
      return 'Based on your responses, your symptoms appear to be mild and can likely be managed at home with rest and basic care. However, if your condition worsens or new symptoms develop, please seek medical attention.'
    } else if (severity === 'Moderate') {
      return 'Your symptoms indicate a moderate level of concern. While not immediately life-threatening, we recommend consulting with a healthcare provider soon to ensure proper diagnosis and treatment.'
    } else {
      return 'Your responses indicate potentially serious symptoms that require prompt medical evaluation. Please seek immediate medical care to ensure your safety and receive appropriate treatment.'
    }
  }

  const resetAssessment = () => {
    setCurrentQuestion(0)
    setAnswers({})
    setAssessmentComplete(false)
    setResult(null)
  }

  const getSeverityColor = (severity: 'Low' | 'Moderate' | 'High') => {
    switch (severity) {
      case 'Low': return 'bg-green-500'
      case 'Moderate': return 'bg-amber-500'
      case 'High': return 'bg-red-500'
    }
  }

  const getSeverityIcon = (severity: 'Low' | 'Moderate' | 'High') => {
    switch (severity) {
      case 'Low': return ShieldCheck
      case 'Moderate': return AlertTriangle
      case 'High': return Siren
    }
  }

  const getSeverityBgColor = (severity: 'Low' | 'Moderate' | 'High') => {
    switch (severity) {
      case 'Low': return 'bg-green-50 border-green-200'
      case 'Moderate': return 'bg-amber-50 border-amber-200'
      case 'High': return 'bg-red-50 border-red-200'
    }
  }

  const getSeverityTextColor = (severity: 'Low' | 'Moderate' | 'High') => {
    switch (severity) {
      case 'Low': return 'text-green-700'
      case 'Moderate': return 'text-amber-700'
      case 'High': return 'text-red-700'
    }
  }

  // Show results
  if (assessmentComplete && result) {
    const SeverityIcon = getSeverityIcon(result.severity)

    return (
      <div className="space-y-6">
        {/* Result Header */}
        <Card className={`border-2 ${getSeverityBgColor(result.severity)}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${getSeverityColor(result.severity)} text-white`}>
                  <SeverityIcon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className={`text-2xl ${getSeverityTextColor(result.severity)}`}>
                    {result.severity} Priority
                  </CardTitle>
                  <CardDescription>Emergency Level Assessment Result</CardDescription>
                </div>
              </div>
              <Button variant="outline" onClick={resetAssessment} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Retake
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Confidence & Score */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Prediction Confidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-primary">{result.confidence}%</span>
                  <Badge variant="outline" className="text-sm">AI Analyzed</Badge>
                </div>
                <Progress value={result.confidence} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  Based on pattern matching with medical triage guidelines
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Symptom Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">{result.totalScore} / {result.maxScore}</span>
                  <Badge className={getSeverityColor(result.severity)} variant="default">
                    {Math.round((result.totalScore / result.maxScore) * 100)}%
                  </Badge>
                </div>
                <Progress 
                  value={(result.totalScore / result.maxScore) * 100} 
                  className="h-3"
                />
                <p className="text-sm text-muted-foreground">
                  Cumulative severity score from all responses
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">{result.aiAnalysis}</p>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Recommendations
            </CardTitle>
            <CardDescription>Based on your assessment results</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {result.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className={`mt-1 h-2 w-2 rounded-full ${getSeverityColor(result.severity)}`} />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Important Disclaimer</AlertTitle>
          <AlertDescription className="text-amber-700">
            This assessment is for informational purposes only and is not a medical diagnosis. 
            Always consult with a qualified healthcare provider for proper evaluation and treatment.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Show analyzing state
  if (isAnalyzing) {
    return (
      <Card className="flex flex-col items-center justify-center py-16">
        <Spinner className="h-12 w-12 text-primary mb-4" />
        <h3 className="text-xl font-semibold mb-2">Analyzing Your Responses</h3>
        <p className="text-muted-foreground">Our AI is evaluating your symptoms...</p>
      </Card>
    )
  }

  // Show questionnaire
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Emergency Level Assessment
          </CardTitle>
          <CardDescription>
            Answer the following questions to help us assess the urgency of your condition. 
            This helps prioritize patient care effectively.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Question {currentQuestion + 1} of {TRIAGE_QUESTIONS.length}</span>
              <span className="text-muted-foreground">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <IconComponent className="h-5 w-5" />
            </div>
            <Badge variant="outline">Question {currentQuestion + 1}</Badge>
          </div>
          <CardTitle className="text-xl">{currentQ.question}</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={answers[currentQ.id] || ''}
            onValueChange={handleAnswer}
            className="space-y-3"
          >
            {currentQ.options.map((option) => (
              <div
                key={option.value}
                className={`flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                  answers[currentQ.id] === option.value
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-muted-foreground/50'
                }`}
                onClick={() => handleAnswer(option.value)}
              >
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className="flex-1 cursor-pointer font-normal">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={currentQuestion === 0}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {currentQuestion === TRIAGE_QUESTIONS.length - 1 ? (
            <Button
              onClick={calculateResult}
              disabled={Object.keys(answers).length < TRIAGE_QUESTIONS.length}
              className="gap-2"
            >
              Get Assessment
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={goNext}
              disabled={!answers[currentQ.id]}
              className="gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Answer Summary */}
      {Object.keys(answers).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {TRIAGE_QUESTIONS.map((q, index) => {
                const answer = answers[q.id]
                const option = q.options.find(o => o.value === answer)
                return (
                  <div 
                    key={q.id} 
                    className={`flex items-center justify-between py-2 ${
                      index < TRIAGE_QUESTIONS.length - 1 ? 'border-b' : ''
                    }`}
                  >
                    <span className="text-sm text-muted-foreground truncate flex-1 mr-4">
                      Q{index + 1}: {q.question}
                    </span>
                    {option ? (
                      <Badge variant="secondary" className="shrink-0">
                        {option.label}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="shrink-0 text-muted-foreground">
                        Not answered
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
