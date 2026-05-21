"use client"

import { useEffect, type RefObject } from "react"

interface UseEscapeToCloseOptions {
  enabled: boolean
  onEscape: () => void
  containerRef: RefObject<HTMLElement | null>
}

export function useEscapeToClose({ enabled, onEscape, containerRef }: UseEscapeToCloseOptions) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return

      const container = containerRef.current
      if (!container) return

      const layers = Array.from(document.querySelectorAll<HTMLElement>('[data-escapable-layer="true"]'))
      if (layers.at(-1) !== container) return

      event.preventDefault()
      onEscape()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [containerRef, enabled, onEscape])
}
