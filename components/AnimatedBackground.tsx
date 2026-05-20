"use client"
import { useEffect, useMemo, useRef, useState } from "react"

interface Particle {
  id: number
  left: string
  size: string
  delay: string
  duration: string
  driftX: string
  opacity: number
}

export default function AnimatedBackground() {
  const [mounted, setMounted] = useState(false)
  const frameRef = useRef<number | null>(null)
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    setMounted(true)

    const setMousePosition = () => {
      frameRef.current = null
      document.documentElement.style.setProperty("--mouse-x", `${mouseRef.current.x}px`)
      document.documentElement.style.setProperty("--mouse-y", `${mouseRef.current.y}px`)
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
      if (frameRef.current === null) {
        frameRef.current = window.requestAnimationFrame(setMousePosition)
      }
    }

    // Set initial position of mouse-glow to center
    mouseRef.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    setMousePosition()

    window.addEventListener("mousemove", handleMouseMove, { passive: true })
    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
      }
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  // Generate stable particle configuration on mount
  const particles = useMemo(() => {
    const arr: Particle[] = []
    for (let i = 0; i < 12; i++) {
      const sizeVal = Math.random() * 5 + 3 // 3px to 8px
      const durationVal = Math.random() * 12 + 12 // 12s to 24s
      const delayVal = Math.random() * -20 // negative delay to start immediately
      const driftVal = Math.random() * 40 - 20 // -20px to 20px
      const opacityVal = Math.random() * 0.35 + 0.15 // 0.15 to 0.5 opacity

      arr.push({
        id: i,
        left: `${Math.random() * 100}%`,
        size: `${sizeVal}px`,
        delay: `${delayVal}s`,
        duration: `${durationVal}s`,
        driftX: `${driftVal}px`,
        opacity: opacityVal,
      })
    }
    return arr;
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-background">
      {/* Dynamic Grid Background with Radial mouse mask */}
      <div 
        className="absolute inset-0 opacity-80"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--grid-color) 1px, transparent 1px),
            linear-gradient(to bottom, var(--grid-color) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(circle 380px at var(--mouse-x, 50%) var(--mouse-y, 50%), black 15%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(circle 380px at var(--mouse-x, 50%) var(--mouse-y, 50%), black 15%, transparent 80%)",
        }}
      />

      {/* Static Subdued Ambient Grid (to keep grid visible outside of mouse glow) */}
      <div 
        className="absolute inset-0 opacity-[0.25]"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--grid-color) 1px, transparent 1px),
            linear-gradient(to bottom, var(--grid-color) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      />

      {/* Floating Ambient Glow Blobs */}
      <div className="absolute top-[-15%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-emerald-400/14 dark:bg-emerald-500/9 blur-[120px] animate-[drift-slow_28s_ease-in-out_infinite]" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-teal-400/12 dark:bg-teal-500/8 blur-[140px] animate-[drift-medium_34s_ease-in-out_infinite]" />
      <div className="absolute top-[25%] right-[5%] w-[40vw] h-[40vw] rounded-full bg-lime-400/8 dark:bg-lime-500/5 blur-[100px] animate-[drift-fast_22s_ease-in-out_infinite]" />

      {/* Drifting Floating dust/particles */}
      <div className="absolute inset-0 z-0">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              backgroundColor: p.id % 3 === 0 ? "var(--primary)" : p.id % 3 === 1 ? "#10b981" : "#14b8a6",
              animation: `particle-drift ${p.duration} linear infinite`,
              animationDelay: p.delay,
              opacity: 0,
              "--particle-opacity": p.opacity,
              "--drift-x": p.driftX,
            } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  )
}
