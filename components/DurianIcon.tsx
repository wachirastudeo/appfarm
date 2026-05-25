import type { SVGProps } from "react"

interface DurianIconProps extends SVGProps<SVGSVGElement> {
  size?: number | string
}

export default function DurianIcon({ size = 24, width, height, ...props }: DurianIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width={width ?? size} height={height ?? size} {...props}>
      {/* Stem */}
      <path
        d="M12 7C12.2 5.2 13 4 14.8 3.3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      
      {/* Spiky Husk (Left Half) */}
      <path
        d="M12 7L9.5 8.5L10.5 10L8 11L9.5 12.5L7 14L9 15.5L7.5 17L10 18.5L12 20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Smooth Husk (Right Half) */}
      <path
        d="M12 7C16.5 7 18 11 18 13.5C18 16.5 16.5 20 12 20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Durian Pulp Segments (2D Minimalist) */}
      <path
        d="M12.8 9.5C14.5 9.5 15.8 10.5 15.8 12C15.8 13.5 14.5 14.5 12.8 14.5C12 14.5 11.8 13.5 11.8 12C11.8 10.5 12 9.5 12.8 9.5Z"
        fill="currentColor"
        fillOpacity="0.85"
      />
      <path
        d="M12.6 15C13.8 15 14.8 15.6 14.8 16.7C14.8 17.8 13.8 18.5 12.6 18.5C12 18.5 11.8 17.8 11.8 16.7C11.8 15.6 12 15 12.6 15Z"
        fill="currentColor"
        fillOpacity="0.85"
      />
    </svg>
  )
}
