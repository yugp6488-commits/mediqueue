'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    router.push('/auth/otp-login')
  }, [router])

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <p className="text-muted-foreground">Redirecting to OTP login...</p>
    </div>
  )
}

