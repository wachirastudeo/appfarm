"use client"

import { cn } from "@/lib/utils"

export default function RetroGrid({
  className,
  angle = 65,
}: {
  className?: string
  angle?: number
}) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden opacity-50 [perspective:200px]",
        className
      )}
      style={{ "--grid-angle": `${angle}deg` } as React.CSSProperties}
    >
      {/* Grid */}
      <div className="absolute inset-0 [transform:rotateX(var(--grid-angle))]">
        <div
          className={cn(
            "animate-retro-grid",
            "bg-[linear-gradient(to_right,rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.05)_1px,transparent_1px)]",
            "bg-[size:60px_60px]",
            "dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)]",
            "[background-repeat:repeat] [grid-repeat:repeat]",
            "origin-top",
            "w-[600%] -left-[250%] h-[1000%] absolute inset-0"
          )}
        />
      </div>

      {/* Shadow Mask */}
      <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent to-90% dark:from-[#0F1F17]" />
    </div>
  )
}
