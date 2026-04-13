'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle2, Loader2, Clock } from 'lucide-react'

export default function OTPVerifyPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const router = useRouter()

  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes
  const [canResend, setCanResend] = useState(false)

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true)
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (!code || code.length !== 6) {
        throw new Error('Please enter a valid 6-digit code')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'OTP verification failed')
      }

      const data = await response.json()
      console.log('✅ OTP verified successfully:', data)
      setSuccess(true)

      // Store auth token and email
      localStorage.setItem('auth_token', data.auth_token)
      localStorage.setItem('user_email', email)

      // Redirect to patient portal after showing success message
      const redirectTimer = setTimeout(() => {
        console.log('🚀 Redirecting to /patient')
        router.push('/patient')
      }, 1500)
      
      return () => clearTimeout(redirectTimer)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Verification failed'
      console.error('❌ Verification error:', errorMsg)
      setError(errorMsg)
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to resend OTP')
      }

      setTimeLeft(600)
      setCanResend(false)
      setCode('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-gradient-to-b from-primary/10 to-background">
        <header className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-white">⚕️</span>
            </div>
            <h1 className="text-xl font-bold">MediCore</h1>
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center px-4">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold">Verified!</h2>
            <p className="mt-2 text-muted-foreground">
              Redirecting to your patient portal...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-b from-primary/10 to-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-white">⚕️</span>
          </div>
          <h1 className="text-xl font-bold">MediCore</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Verify OTP</CardTitle>
            <CardDescription>
              Enter the 6-digit code sent to <br />
              <span className="font-medium text-foreground">{email}</span>
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              {error && (
                <div className="flex items-center gap-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="code">6-Digit Code</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="text-center text-2xl tracking-widest font-mono"
                  disabled={isLoading}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Code expires in {formatTime(timeLeft)}
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || code.length !== 6}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify OTP'
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleResendOTP}
                disabled={!canResend || isLoading}
              >
                {canResend ? (
                  'Resend OTP'
                ) : (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    Resend in {formatTime(timeLeft)}
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => router.push('/auth/otp-login')}
              >
                Use Different Email
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
