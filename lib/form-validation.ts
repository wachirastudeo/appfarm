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
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
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
