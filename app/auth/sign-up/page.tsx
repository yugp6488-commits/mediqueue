'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Sign-up page redirects to OTP login
 * No more email/password signup - using OTP only
 */
export default function SignUpPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to OTP login for unified authentication
    router.push('/auth/otp-login')
  }, [router])

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecting to OTP login...</p>
      </div>
    </div>
  )
}

