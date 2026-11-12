"use client"
import type { ReactNode } from "react"
import { CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import Portal from "@/components/Portal"
import { addDaysToKey, formatThaiDate, todayKey } from "@/lib/date-utils"
import {
  Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle,
} from "@/components/ui/drawer"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"

/** Bottom sheet used for every record form: thumb-friendly on phones, centred on desktop. */
export function RecordSheet({ open, onOpenChange, title, description, children, footer }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <DrawerContent className="mx-auto w-full max-w-lg data-[vaul-drawer-direction=bottom]:max-h-[92dvh] data-[vaul-drawer-direction=bottom]:rounded-t-3xl border-border bg-card">
        <DrawerHeader className="px-5 pb-2 pt-3 text-left">
          <DrawerTitle className="text-lg font-black">{title}</DrawerTitle>
          {description ? <DrawerDescription className="text-sm">{description}</DrawerDescription> : <DrawerDescription className="sr-only">{title}</DrawerDescription>}
        </DrawerHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">{children}</div>
        {footer && (
          <DrawerFooter className="border-t border-border bg-card px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {footer}
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  )
}

export function Field({ label, hint, children, className }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-bold text-foreground">{label}</p>
        {hint && <span className="text-xs font-medium text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

export const inputClass =
  "w-full min-h-12 rounded-xl border border-border bg-background px-3.5 py-2.5 text-base font-medium text-foreground placeholder:text-muted-foreground/70 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25"

export function Chip({ active, onClick, children, className, activeClass }: {
  active?: boolean
  onClick?: () => void
  children: ReactNode
  className?: string
  /** Override the selected look (e.g. colour-coded priority). */
  activeClass?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-full border px-3.5 text-sm font-bold transition active:scale-[0.97]",
        active
          ? activeClass ?? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-card text-foreground/80 hover:border-primary/40 hover:bg-muted",
        className,
      )}
    >
      {children}
    </button>
  )
}

/** Horizontally scrolling chip row that bleeds to the sheet edge. */
export function ChipRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 scrollbar-hide", className)}>{children}</div>
}

/** Quick day chips plus a native picker for anything else. */
export function DateQuickPicker({ value, onChange, direction = "past" }: {
  value: string
  onChange: (key: string) => void
  /** "past" for records of work done, "future" for planning. */
  direction?: "past" | "future"
}) {
  const today = todayKey()
  const presets = direction === "past"
    ? [{ key: today, label: "วันนี้" }, { key: addDaysToKey(today, -1), label: "เมื่อวาน" }, { key: addDaysToKey(today, -2), label: "2 วันก่อน" }]
    : [{ key: today, label: "วันนี้" }, { key: addDaysToKey(today, 1), label: "พรุ่งนี้" }, { key: addDaysToKey(today, 7), label: "อีก 7 วัน" }]
  const isPreset = presets.some(p => p.key === value)

  return (
    <ChipRow>
      {presets.map(p => (
        <Chip key={p.label} active={value === p.key} onClick={() => onChange(p.key)}>{p.label}</Chip>
      ))}
      <label
        className={cn(
          "relative inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-sm font-bold transition",
          !isPreset ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground/80 hover:bg-muted",
        )}
      >
        <CalendarDays size={15} />
        {isPreset ? "เลือกวัน" : formatThaiDate(value, { weekday: true, year: true })}
        <input
          type="date"
          value={value}
          onChange={e => e.target.value && onChange(e.target.value)}
          aria-label="เลือกวันที่"
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
    </ChipRow>
  )
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm font-bold text-destructive">
      {message}
    </p>
  )
}

export function PrimaryButton({ children, onClick, className, disabled }: { children: ReactNode; onClick?: () => void; className?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-base font-black text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98] disabled:opacity-40",
        className,
      )}
    >
      {children}
    </button>
  )
}

export function GhostButton({ children, onClick, className, tone = "default" }: { children: ReactNode; onClick?: () => void; className?: string; tone?: "default" | "danger" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold transition active:scale-[0.98]",
        tone === "danger"
          ? "border-destructive/30 text-destructive hover:bg-destructive/10"
          : "border-border text-foreground/80 hover:bg-muted",
        className,
      )}
    >
      {children}
    </button>
  )
}

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = "ลบ", onConfirm }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  onConfirm: () => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row gap-2 sm:justify-end">
          <AlertDialogCancel className="mt-0 min-h-11 flex-1 sm:flex-none">ยกเลิก</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="min-h-11 flex-1 bg-destructive text-white hover:bg-destructive/90 sm:flex-none">
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** Round floating action button that sits above the mobile bottom nav. */
export function Fab({ onClick, label, icon }: { onClick: () => void; label: string; icon: ReactNode }) {
  // Portalled: page wrappers use CSS transforms, which would re-anchor `position: fixed`.
  return (
    <Portal>
    <button
      type="button"
      onClick={onClick}
      className="fixed right-4 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-40 inline-flex h-14 items-center gap-2 rounded-full bg-primary pl-4 pr-5 text-base font-black text-primary-foreground shadow-[0_10px_30px_rgba(21,128,61,0.35)] transition active:scale-95 lg:hidden"
    >
      {icon}
      {label}
    </button>
    </Portal>
  )
}
