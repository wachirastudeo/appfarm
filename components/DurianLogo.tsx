import type { SVGProps } from "react"

interface DurianLogoProps extends SVGProps<SVGSVGElement> {
  size?: number | string
}

export default function DurianLogo({ size = 32, width, height, className, ...props }: DurianLogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={width ?? size}
      height={height ?? size}
      className={className}
      {...props}
    >
      {/* Left Husk Soft Background Tint */}
      <path
        d="M12 5.5
           Q10.5 6.5 10.5 7.5
           Q9 8 9 9.2
           Q7.5 9.8 7.5 11
           Q6 11.8 6 13
           Q4.5 13.8 4.8 15.2
           Q6 16.5 6.5 17.5
           Q8 18.5 9.5 19.2
           Q11 20 12 20.5
           C11.2 16.5 11.2 9.5 12 5.5 Z"
        className="fill-[#E7F3EC] dark:fill-[#1D3A29]/40"
      />

      {/* Right Husk Soft Background Tint */}
      <path
        d="M12 5.5
           C16.5 5.5 19 9 19 13.5
           C19 18 16.5 20.5 12 20.5
           C11.2 16.5 11.2 9.5 12 5.5 Z"
        className="fill-amber-50/40 dark:fill-amber-950/10"
      />

      {/* Pulp Segments Soft Fill */}
      <path
        d="M14 9.5 C15.5 9.5 16.5 10.5 16.5 11.8 C16.5 13 15.5 13.8 14 13.8 C12.8 13.8 12.5 13 12.5 11.8 C12.5 10.5 12.8 9.5 14 9.5 Z"
        fill="#FFD54F"
        fillOpacity="0.35"
      />
      <path
        d="M13.5 14.5 C15 14.5 15.8 15.5 15.8 16.8 C15.8 18 15 18.8 13.5 18.8 C12.5 18.8 12.2 18 12.2 16.8 C12.2 15.5 12.5 14.5 13.5 14.5 Z"
        fill="#FFCA28"
        fillOpacity="0.35"
      />

      {/* Stem Line Art */}
      <path
        d="M12 5.5 C12 3.5 12.8 2.3 14 1.8"
        stroke="#8D6E63"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Leaf Line Art */}
      <path
        d="M13 2.8 C14.5 2 16 2.8 16 4 C15.2 4.8 13.8 4.5 13 2.8 Z"
        className="stroke-[#146B3E] dark:stroke-[#72C08A] fill-[#C8E6C9] dark:fill-[#31533D]/60"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Spiky Husk Outline (Left Half) */}
      <path
        d="M12 5.5
           Q10.5 6.5 10.5 7.5
           Q9 8 9 9.2
           Q7.5 9.8 7.5 11
           Q6 11.8 6 13
           Q4.5 13.8 4.8 15.2
           Q6 16.5 6.5 17.5
           Q8 18.5 9.5 19.2
           Q11 20 12 20.5"
        className="stroke-[#146B3E] dark:stroke-[#72C08A]"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Smooth Husk Outline (Right Half) */}
      <path
        d="M12 5.5
           C16.5 5.5 19 9 19 13.5
           C19 18 16.5 20.5 12 20.5"
        className="stroke-[#146B3E] dark:stroke-[#72C08A]"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Center Division Line */}
      <path
        d="M12 5.5 C11.2 9.5 11.2 16.5 12 20.5"
        className="stroke-[#146B3E]/40 dark:stroke-[#72C08A]/45"
        strokeWidth="1.2"
        strokeDasharray="1 2"
        strokeLinecap="round"
      />

      {/* Durian Pulp Outline (Vibrant Yellow Line Art) */}
      <path
        d="M14 9.5 C15.5 9.5 16.5 10.5 16.5 11.8 C16.5 13 15.5 13.8 14 13.8 C12.8 13.8 12.5 13 12.5 11.8 C12.5 10.5 12.8 9.5 14 9.5 Z"
        stroke="#FFB300"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.5 14.5 C15 14.5 15.8 15.5 15.8 16.8 C15.8 18 15 18.8 13.5 18.8 C12.5 18.8 12.2 18 12.2 16.8 C12.2 15.5 12.5 14.5 13.5 14.5 Z"
        stroke="#FFB300"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
