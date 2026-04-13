'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { Activity, Heart, Clock, Shield, Users, Stethoscope, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function AnimatedLanding() {
  const introRef = useRef<HTMLDivElement>(null)
  const introTextRef = useRef<HTMLHeadingElement>(null)
  const startButtonRef = useRef<HTMLAnchorElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const badgeRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const descRef = useRef<HTMLParagraphElement>(null)
  const buttonsRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const featureCardsRef = useRef<HTMLDivElement>(null)
  const staffRef = useRef<HTMLDivElement>(null)
  const floatingRef = useRef<HTMLDivElement>(null)
  const syringeCursor = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24'%3E%3Ctext x='0' y='19' font-size='18'%3E%F0%9F%92%89%3C/text%3E%3C/svg%3E") 4 20, pointer`

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Soft glow breathing effect for intro text.
      gsap.to(introTextRef.current, {
        textShadow: '0 0 18px rgba(255,255,255,0.55), 0 0 30px rgba(244,114,182,0.35)',
        scale: 1.02,
        duration: 1,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      })

      // Intro splash: show "Start Healing", then transition into landing content.
      const introTl = gsap.timeline()
      introTl
        .fromTo(
          introTextRef.current,
          { opacity: 0, scale: 0.88, y: 14 },
          { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: 'power3.out' }
        )
        .to(
          introTextRef.current,
          { duration: 0.8, ease: 'power2.inOut' },
          '+=2'
        )
        .to(
          introRef.current,
          { backgroundColor: 'rgba(0,0,0,0)', duration: 0.45, ease: 'power2.inOut' },
          '-=0.45'
        )

      introTl.call(() => {
        const introEl = introTextRef.current
        const targetEl = startButtonRef.current
        if (!introEl || !targetEl) return

        const introRect = introEl.getBoundingClientRect()
        const targetRect = targetEl.getBoundingClientRect()

        const introCenterX = introRect.left + introRect.width / 2
        const introCenterY = introRect.top + introRect.height / 2
        const targetCenterX = targetRect.left + targetRect.width / 2
        const targetCenterY = targetRect.top + targetRect.height / 2

        const x = targetCenterX - introCenterX
        const y = targetCenterY - introCenterY
        const scale = Math.max(0.38, Math.min(0.62, targetRect.width / introRect.width))

        gsap.to(introEl, {
          x,
          y,
          scale,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.inOut',
        })

        gsap.fromTo(
          targetEl,
          { boxShadow: '0 0 0 rgba(59,130,246,0)' },
          {
            boxShadow: '0 0 28px rgba(59,130,246,0.5)',
            duration: 0.45,
            yoyo: true,
            repeat: 1,
            ease: 'power1.inOut',
          }
        )
      }, undefined, '-=0.8')

      introTl.to(introRef.current, {
        opacity: 0,
        pointerEvents: 'none',
        duration: 0.25,
      })

      // Initial timeline for hero section
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 2.6 })

      // Nav animation
      tl.fromTo(
        navRef.current,
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 }
      )

      // Badge animation
      tl.fromTo(
        badgeRef.current,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6 },
        '-=0.4'
      )

      // Title animation with split text effect
      tl.fromTo(
        titleRef.current,
        { y: 60, opacity: 0, clipPath: 'inset(100% 0% 0% 0%)' },
        { y: 0, opacity: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: 1 },
        '-=0.3'
      )

      // Description animation
      tl.fromTo(
        descRef.current,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 },
        '-=0.6'
      )

      // Buttons stagger animation
      tl.fromTo(
        buttonsRef.current?.children || [],
        { y: 30, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.15 },
        '-=0.4'
      )

      // Floating elements animation
      if (floatingRef.current) {
        gsap.to(floatingRef.current.querySelectorAll('.floating-icon'), {
          y: -20,
          duration: 2,
          ease: 'power1.inOut',
          yoyo: true,
          repeat: -1,
          stagger: 0.3
        })
      }

      // Pulse animation for the badge
      gsap.to(badgeRef.current, {
        boxShadow: '0 0 20px rgba(var(--primary), 0.3)',
        duration: 1.5,
        ease: 'power1.inOut',
        yoyo: true,
        repeat: -1
      })

      // Features section scroll animation
      ScrollTrigger.create({
        trigger: featuresRef.current,
        start: 'top 80%',
        onEnter: () => {
          gsap.fromTo(
            featuresRef.current?.querySelector('h2'),
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
          )
        },
        once: true
      })

      // Feature cards stagger animation on scroll
      ScrollTrigger.create({
        trigger: featureCardsRef.current,
        start: 'top 75%',
        onEnter: () => {
          gsap.fromTo(
            featureCardsRef.current?.children || [],
            { y: 80, opacity: 0, scale: 0.9 },
            { 
              y: 0, 
              opacity: 1, 
              scale: 1, 
              duration: 0.8, 
              stagger: 0.2, 
              ease: 'back.out(1.2)' 
            }
          )
        },
        once: true
      })

      // Staff section animation
      ScrollTrigger.create({
        trigger: staffRef.current,
        start: 'top 80%',
        onEnter: () => {
          gsap.fromTo(
            staffRef.current?.querySelectorAll('a') || [],
            { x: -50, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.6, stagger: 0.2, ease: 'power3.out' }
          )
        },
        once: true
      })

      // Hover animations for feature cards
      const cards = featureCardsRef.current?.children
      if (cards) {
        Array.from(cards).forEach((card) => {
          card.addEventListener('mouseenter', () => {
            gsap.to(card, { 
              y: -10, 
              scale: 1.02,
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              duration: 0.3, 
              ease: 'power2.out' 
            })
          })
          card.addEventListener('mouseleave', () => {
            gsap.to(card, { 
              y: 0, 
              scale: 1,
              boxShadow: '0 0 0 rgba(0,0,0,0)',
              duration: 0.3, 
              ease: 'power2.out' 
            })
          })
        })
      }
    })

    return () => {
      ctx.revert()
    }
  }, [])

  return (
    <main className="min-h-screen bg-background overflow-hidden">
      {/* Intro Splash */}
      <div
        ref={introRef}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background"
      >
        <h1
          ref={introTextRef}
          className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight bg-gradient-to-r from-rose-300 via-pink-200 to-sky-200 bg-clip-text text-transparent text-center px-6"
        >
          Precision at every heartbeat
        </h1>
      </div>

      {/* Floating Background Icons */}
      <div ref={floatingRef} className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="floating-icon absolute top-20 left-[10%] text-primary/10">
          <Heart className="h-16 w-16" />
        </div>
        <div className="floating-icon absolute top-40 right-[15%] text-primary/10">
          <Activity className="h-20 w-20" />
        </div>
        <div className="floating-icon absolute bottom-40 left-[20%] text-primary/10">
          <Shield className="h-14 w-14" />
        </div>
        <div className="floating-icon absolute top-60 left-[70%] text-primary/10">
          <Sparkles className="h-12 w-12" />
        </div>
        <div className="floating-icon absolute bottom-60 right-[10%] text-primary/10">
          <Stethoscope className="h-18 w-18" />
        </div>
      </div>

      <div>
      {/* Hero Section */}
      <section ref={heroRef} className="relative z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(var(--primary),0.1),transparent_50%)]" />
        
        <div className="mx-auto max-w-6xl px-4 py-20 relative">
          <nav ref={navRef} className="flex items-center justify-between mb-16 opacity-0">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary animate-pulse">
                <Activity className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">MediQueue</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/doctor" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Doctor Portal
              </Link>
              <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Admin Portal
              </Link>
            </div>
          </nav>

          <div className="text-center max-w-3xl mx-auto">
            <div 
              ref={badgeRef}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 opacity-0"
            >
              <Heart className="h-4 w-4 animate-pulse" />
              Your Health, Our Priority
            </div>
            
            <h1 
              ref={titleRef}
              className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6 text-balance opacity-0"
            >
              Skip the Wait,{' '}
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                Start Your Care Journey
              </span>
            </h1>
            
            <p 
              ref={descRef}
              className="text-xl text-muted-foreground mb-10 text-balance leading-relaxed opacity-0"
            >
              MediQueue streamlines your hospital visit with digital check-in, real-time queue updates, 
              and AI-powered health assessments for faster, smarter care.
            </p>
            
            <div ref={buttonsRef} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8 py-6 group opacity-0">
                <Link ref={startButtonRef} href="/auth/login" style={{ cursor: syringeCursor }}>
                  <Heart className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  Start Healing
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 group opacity-0">
                <Link href="/auth/sign-up">
                  <Sparkles className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                  Create Account
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-20 bg-muted/30 relative z-10">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12 opacity-0">
            Why Choose{' '}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              MediQueue
            </span>
            ?
          </h2>
          <div ref={featureCardsRef} className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Clock}
              title="Real-Time Updates"
              description="Track your queue position and estimated wait time from anywhere with live notifications."
              gradient="from-blue-500 to-cyan-500"
            />
            <FeatureCard
              icon={Sparkles}
              title="AI Health Assessment"
              description="Get instant preliminary health analysis with our AI-powered triage system."
              gradient="from-purple-500 to-pink-500"
            />
            <FeatureCard
              icon={Shield}
              title="Secure Records"
              description="Access your visit history and prescriptions safely with bank-level encryption."
              gradient="from-emerald-500 to-teal-500"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-t border-border relative z-10">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <StatItem value="50K+" label="Can be served" />
            <StatItem value="98%" label="Satisfaction Rate" />
            <StatItem value="15min" label="Avg Wait Reduction" />
            <StatItem value="24/7" label="AI Support" />
          </div>
        </div>
      </section>

      {/* Staff Access Section */}
      <section className="py-16 bg-muted/20 relative z-10">
        <div className="mx-auto max-w-6xl px-4">
          <h3 className="text-lg font-semibold text-center text-muted-foreground mb-8">
            Staff Access
          </h3>
          <div ref={staffRef} className="flex flex-wrap justify-center gap-6">
            <Link href="/doctor" className="group">
              <div className="flex items-center gap-3 px-6 py-4 rounded-xl border border-border bg-card hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-100">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 group-hover:scale-110 transition-transform">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground group-hover:text-emerald-700 transition-colors">Doctor Portal</p>
                  <p className="text-sm text-muted-foreground">Manage patient queue</p>
                </div>
              </div>
            </Link>
            <Link href="/admin" className="group">
              <div className="flex items-center gap-3 px-6 py-4 rounded-xl border border-border bg-card hover:border-amber-300 hover:bg-amber-50 transition-all duration-300 hover:shadow-lg hover:shadow-amber-100">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 group-hover:scale-110 transition-transform">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground group-hover:text-amber-700 transition-colors">Admin Portal</p>
                  <p className="text-sm text-muted-foreground">System management</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border relative z-10">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
          <p>Secure access to patient records and hospital operations</p>
        </div>
      </footer>
      </div>
    </main>
  )
}

function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  gradient 
}: { 
  icon: typeof Clock
  title: string
  description: string
  gradient: string
}) {
  return (
    <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-card border border-border cursor-pointer opacity-0">
      <div className={`flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white mb-5 shadow-lg`}>
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}

function StatItem({ value, label }: { value: string; label: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const valueRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const containerEl = containerRef.current
    const valueEl = valueRef.current
    if (!valueEl || !containerEl) return

    const parseValue = (rawValue: string) => {
      if (rawValue.includes('/')) {
        const [left, right] = rawValue.split('/')
        return { target: Number(left) || 0, suffix: `/${right}`, decimals: 0 }
      }

      const numericMatch = rawValue.match(/[\d.]+/)
      const numericPart = numericMatch ? Number(numericMatch[0]) : 0
      const suffix = rawValue.replace(/[\d.]/g, '')
      const decimals = rawValue.includes('.') ? 1 : 0

      return { target: numericPart, suffix, decimals }
    }

    const { target, suffix, decimals } = parseValue(value)
    const initialText = `${decimals > 0 ? (0).toFixed(decimals) : '0'}${suffix}`
    valueEl.textContent = initialText

    let tween: gsap.core.Tween | null = null
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return

        if (entry.isIntersecting) {
          tween?.kill()
          valueEl.textContent = initialText

          const counter = { current: 0 }
          tween = gsap.to(counter, {
            current: target,
            duration: 1.6,
            ease: 'power2.out',
            onUpdate: () => {
              const formatted =
                decimals > 0 ? counter.current.toFixed(decimals) : Math.round(counter.current).toString()
              valueEl.textContent = `${formatted}${suffix}`
            },
          })
          return
        }

        // Reset when leaving viewport so it can animate again on next entry.
        tween?.kill()
        tween = null
        valueEl.textContent = initialText
      },
      { threshold: 0.45 },
    )

    observer.observe(containerEl)

    return () => {
      observer.disconnect()
      tween?.kill()
    }
  }, [value])

  return (
    <div ref={containerRef} className="space-y-1">
      <p
        ref={valueRef}
        className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
      >
        {value}
      </p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}
