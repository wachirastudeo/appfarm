"use client"

import React from "react"
import { cn } from "@/lib/utils"

export default function ShinyButton({
  children,
  className,
  onClick,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-[#146B3E] px-6 py-3.5 text-base font-black text-white shadow-xl transition-all hover:bg-[#0F5A34] active:scale-[0.98]",
        className
      )}
      {...props}
    >
      <span className="absolute inset-0 block rounded-[inherit] bg-[linear-gradient(to_right,transparent_20%,rgba(255,255,255,0.22)_50%,transparent_80%)] bg-[length:200%_100%] bg-no-repeat transition-[background-position] duration-1000 [background-position:100%_0%] group-hover:[background-position:-100%_0%]" />
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  )
}
