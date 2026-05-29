type Props = {
  src: string
  alt: string
  className?: string
  onError?: () => void
}

/** External OAuth avatars (LINE, Google) often require no-referrer to load in the browser. */
export default function UserAvatarImage({ src, alt, className, onError }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      onError={onError}
    />
  )
}
