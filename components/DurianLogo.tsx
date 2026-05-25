import Image, { type ImageProps } from "next/image"

interface DurianLogoProps extends Omit<ImageProps, "src" | "alt" | "width" | "height"> {
  size?: number
  width?: number
  height?: number
  alt?: string
}

export default function DurianLogo({
  size = 32,
  width,
  height,
  alt = "Durian Flow",
  ...props
}: DurianLogoProps) {
  return (
    <Image
      src="/durian-logo.svg"
      alt={alt}
      width={width ?? size}
      height={height ?? size}
      {...props}
    />
  )
}
