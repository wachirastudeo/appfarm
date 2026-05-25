"use client"

import { Task } from "@/lib/store"

const APP_NAME = "Durian Flow"

function datePart(value: string) {
  return value.split("T")[0]
}

function compactDate(value: string) {
  return datePart(value).replaceAll("-", "")
}

function nextCompactDate(value: string) {
  const [year, month, day] = datePart(value).split("-").map(Number)
  const next = new Date(Date.UTC(year, month - 1, day + 1))
  return next.toISOString().split("T")[0].replaceAll("-", "")
}

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
}

function safeFileName(value: string) {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 60) || "task"
}

export function getGoogleCalendarUrl(task: Task, plotName: string) {
  const startDate = compactDate(task.date)
  const endDate = nextCompactDate(task.date)
  const details = [task.description, `แปลง: ${plotName}`].filter(Boolean).join("\n")

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: task.title,
    dates: `${startDate}/${endDate}`,
    details,
    location: plotName,
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function downloadTaskCalendarFile(task: Task, plotName: string) {
  const startDate = compactDate(task.date)
  const endDate = nextCompactDate(task.date)
  const details = [task.description, `แปลง: ${plotName}`].filter(Boolean).join("\\n")
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"

  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${APP_NAME}//Task Planner//TH`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${task.id}@appfarm.local`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${startDate}`,
    `DTEND;VALUE=DATE:${endDate}`,
    `SUMMARY:${escapeIcsText(task.title)}`,
    `DESCRIPTION:${escapeIcsText(details)}`,
    `LOCATION:${escapeIcsText(plotName)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")

  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${safeFileName(task.title)}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function downloadTasksCalendarFile(tasks: Task[], getPlotName: (plotId: string) => string, fileName = "all-tasks") {
  if (tasks.length === 0) return
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"

  const events = tasks.flatMap((task) => {
    const startDate = compactDate(task.date)
    const endDate = nextCompactDate(task.date)
    const plotName = getPlotName(task.plotId)
    const details = [task.description, `แปลง: ${plotName}`].filter(Boolean).join("\\n")

    return [
      "BEGIN:VEVENT",
      `UID:${task.id}@appfarm.local`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${startDate}`,
      `DTEND;VALUE=DATE:${endDate}`,
      `SUMMARY:${escapeIcsText(task.title)}`,
      `DESCRIPTION:${escapeIcsText(details)}`,
      `LOCATION:${escapeIcsText(plotName)}`,
      "END:VEVENT",
    ]
  })

  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${APP_NAME}//Task Planner//TH`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n")

  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${safeFileName(fileName)}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
