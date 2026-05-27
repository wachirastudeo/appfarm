"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface Sparkle {
  id: string
  color: string
  size: number
  style: React.CSSProperties
}

const DEFAULT_COLOR = "#F59E0B"

const generateSparkle = (color: string): Sparkle => {
  return {
    id: Math.random().toString(),
    color,
    size: Math.random() * 14 + 10,
    style: {
      top: Math.random() * 80 + 10 + "%",
      left: Math.random() * 80 + 10 + "%",
    },
  }
}

export default function SparklesText({
  text,
  className,
  sparklesCount = 4,
  color = DEFAULT_COLOR,
}: {
  text: string
  className?: string
  sparklesCount?: number
  color?: string
}) {
  const [sparkles, setSparkles] = useState<Sparkle[]>([])

  useEffect(() => {
    // Seed initial sparkles
    setSparkles(Array.from({ length: sparklesCount }, () => generateSparkle(color)))

    const interval = setInterval(() => {
      setSparkles((prev) => {
        const next = [...prev]
        if (next.length >= sparklesCount) {
          next.shift()
        }
        next.push(generateSparkle(color))
        return next
      })
    }, 850)

    return () => clearInterval(interval)
  }, [sparklesCount, color])

  return (
    <span className={cn("relative inline-block py-1 px-2", className)}>
      {sparkles.map((sparkle) => (
        <motion.svg
          key={sparkle.id}
          className="absolute z-20 pointer-events-none"
          style={sparkle.style}
          width={sparkle.size}
          height={sparkle.size}
          viewBox="0 0 160 160"
          fill="none"
          initial={{ scale: 0, rotate: 0, opacity: 0 }}
          animate={{ scale: [0, 1.1, 0], rotate: [0, 90, 180], opacity: [0, 1, 0] }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
        >
          <path
            d="M80 0C80 0 80 48.8889 80 80C80 111.111 80 160 80 160C80 160 80 111.111 80 80C80 48.8889 80 0 80 0Z"
            fill={sparkle.color}
          />
          <path
            d="M0 80C0 80 48.8889 80 80 80C111.111 80 160 80 160 80C160 80 111.111 80 80 80C48.8889 80 0 80 0 80Z"
            fill={sparkle.color}
          />
        </motion.svg>
      ))}
      <span className="relative z-10">{text}</span>
    </span>
  )
}
