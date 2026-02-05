import { format, formatDistanceToNow, differenceInSeconds } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Formatea una fecha en formato legible en español
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, "EEEE d 'de' MMMM, yyyy", { locale: es })
}

/**
 * Formatea fecha y hora en formato legible
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, "EEEE d 'de' MMMM, yyyy 'a las' h:mm a", { locale: es })
}

/**
 * Formatea fecha corta
 */
export function formatShortDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'd MMM yyyy', { locale: es })
}

/**
 * Obtiene el tiempo restante hasta una fecha
 */
export function getTimeUntil(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(d, { locale: es, addSuffix: true })
}

/**
 * Calcula el countdown en días, horas, minutos y segundos
 */
export function calculateCountdown(targetDate: Date | string): {
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
} {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate
  const now = new Date()
  const totalSeconds = differenceInSeconds(target, now)

  if (totalSeconds <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true }
  }

  const days = Math.floor(totalSeconds / (60 * 60 * 24))
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60))
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60)
  const seconds = totalSeconds % 60

  return { days, hours, minutes, seconds, isExpired: false }
}

/**
 * Convierte fecha local a ISO string UTC
 */
export function toUTCString(date: Date): string {
  return date.toISOString()
}

/**
 * Convierte un datetime-local value a Date
 */
export function fromDateTimeLocal(value: string): Date {
  return new Date(value)
}

/**
 * Convierte Date a datetime-local format
 */
export function toDateTimeLocal(date: Date): string {
  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60 * 1000)
  return localDate.toISOString().slice(0, 16)
}

/**
 * Formatea solo la fecha (Domingo 8 de Febrero)
 */
export function formatDateOnly(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, "EEEE d 'de' MMMM", { locale: es })
}

/**
 * Formatea solo la hora (12:00 PM)
 */
export function formatTimeOnly(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'h:mm a', { locale: es })
}
