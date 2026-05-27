"use client"

import React from "react"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface InteractiveHoverButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string
  icon?: React.ReactNode
}

export default function InteractiveHoverButton({
  text = "Button",
  icon = <ArrowRight className="h-5 w-5" />,
  className,
  onClick,
  ...props
}: InteractiveHoverButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex h-12 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-2 px-8 text-center text-base font-black text-white transition-all duration-300 active:scale-[0.98] select-none",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 z-0 flex h-full w-full items-center justify-center bg-gradient-to-r from-emerald-600 to-emerald-500 transition-all duration-300 group-hover:scale-105 group-hover:opacity-100" />
      <span className="relative z-10 flex items-center justify-center gap-2 text-white">
        {text}
        <span className="transition-transform duration-300 group-hover:translate-x-1">
          {icon}
        </span>
      </span>
    </button>
  )
}
