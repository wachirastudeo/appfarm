const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/
const MARKUP_CHARACTERS = /[<>]/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const IMAGE_TYPES = new Set(["image/avif", "image/jpeg", "image/png", "image/webp"])

type TextOptions = {
  required?: boolean
  maxLength?: number
  allowMultiline?: boolean
}

export type ValidationResult<T> =
  | { ok: true; value: T; message: "" }
  | { ok: false; value: never; message: string }

function invalid(message: string): ValidationResult<never> {
  return { ok: false, value: undefined as never, message }
}

export function validateText(label: string, value: string, options: TextOptions = {}): ValidationResult<string> {
  const trimmed = value.trim()
  const { required = false, maxLength = 240, allowMultiline = false } = options

  if (required && !trimmed) return invalid(`กรุณากรอก${label}`)
  if (!trimmed) return { ok: true, value: "", message: "" }
  if (trimmed.length > maxLength) return invalid(`${label}ต้องไม่เกิน ${maxLength} ตัวอักษร`)
  if (CONTROL_CHARACTERS.test(trimmed) || (!allowMultiline && /[\r\n]/.test(trimmed))) {
    return invalid(`${label}มีอักขระที่ไม่รองรับ`)
  }
  if (MARKUP_CHARACTERS.test(trimmed)) return invalid(`${label}ห้ามมี < หรือ >`)
  return { ok: true, value: trimmed, message: "" }
}

export function validateEmail(value: string): ValidationResult<string> {
  const text = validateText("อีเมล", value, { required: true, maxLength: 254 })
  if (!text.ok) return text
  if (!EMAIL_PATTERN.test(text.value)) return invalid("กรุณากรอกอีเมลให้ถูกต้อง")
  return { ok: true, value: text.value.toLowerCase(), message: "" }
}

export function validateDate(label: string, value: string): ValidationResult<string> {
  if (!DATE_PATTERN.test(value)) return invalid(`กรุณาเลือก${label}ให้ถูกต้อง`)
  // Validate using local date parts. Avoid toISOString() (UTC): in positive-offset
  // timezones (e.g. ไทย UTC+7) local midnight rolls back a UTC day, which would
  // reject the user's current local date.
  const [y, m, d] = value.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return invalid(`กรุณาเลือก${label}ให้ถูกต้อง`)
  }
  return { ok: true, value, message: "" }
}

export function validateNumber(
  label: string,
  value: number,
  options: { min?: number; max?: number; integer?: boolean } = {},
): ValidationResult<number> {
  if (!Number.isFinite(value)) return invalid(`กรุณากรอก${label}ให้ถูกต้อง`)
  if (options.integer && !Number.isInteger(value)) return invalid(`${label}ต้องเป็นจำนวนเต็ม`)
  if (options.min !== undefined && value < options.min) return invalid(`${label}ต้องไม่น้อยกว่า ${options.min}`)
  if (options.max !== undefined && value > options.max) return invalid(`${label}ต้องไม่เกิน ${options.max}`)
  return { ok: true, value, message: "" }
}

export function validateHttpUrl(label: string, value: string, required = false): ValidationResult<string> {
  const text = validateText(label, value, { required, maxLength: 2048 })
  if (!text.ok || !text.value) return text

  try {
    const url = new URL(text.value)
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return invalid(`${label}ต้องขึ้นต้นด้วย http:// หรือ https://`)
    }
    return { ok: true, value: url.toString(), message: "" }
  } catch {
    return invalid(`กรุณากรอก${label}ให้ถูกต้อง`)
  }
}

export function validateImageFile(file: File, maxBytes: number): ValidationResult<File> {
  if (!IMAGE_TYPES.has(file.type)) return invalid("รองรับเฉพาะไฟล์ AVIF, JPG, PNG หรือ WEBP")
  if (file.size > maxBytes) return invalid(`ไฟล์รูปภาพต้องไม่เกิน ${Math.round(maxBytes / 1024 / 1024)}MB`)
  return { ok: true, value: file, message: "" }
}

export async function resizeAndCompressImage(file: File, maxDimension: number, quality = 0.82): Promise<string> {
  if (typeof window === "undefined") return ""
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight))
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          resolve(reader.result as string)
          return
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        const tryEncode = (mimeType: string) => {
          canvas.toBlob(
            (blob) => {
              if (blob && (blob.type === mimeType || mimeType === "image/jpeg")) {
                const blobReader = new FileReader()
                blobReader.onload = () => resolve(blobReader.result as string)
                blobReader.onerror = () => resolve(reader.result as string)
                blobReader.readAsDataURL(blob)
              } else if (mimeType === "image/webp") {
                tryEncode("image/jpeg")
              } else {
                resolve(reader.result as string)
              }
            },
            mimeType,
            quality
          )
        }
        tryEncode("image/webp")
      }
      img.onerror = () => reject(new Error("Failed to load image for resizing"))
      img.src = reader.result as string
    }
    reader.onerror = () => reject(new Error("Failed to read image file"))
    reader.readAsDataURL(file)
  })
}

