'use client'

import { useCountdown } from '@/hooks/use-countdown'
import { formatDateTime, formatDateOnly, formatTimeOnly } from '@/lib/utils/date'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Users } from 'lucide-react'

interface CountdownProps {
  targetDate: Date | string
  title?: string
  attendeesCount?: number
  location?: string | null
  mapsUrl?: string | null
  cancelled?: boolean
}

export function Countdown({ targetDate, title, attendeesCount, location, mapsUrl, cancelled }: CountdownProps) {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(targetDate)

  const targetDateObj = typeof targetDate === 'string' ? new Date(targetDate) : targetDate
  const now = new Date()
  const isToday = targetDateObj.toDateString() === now.toDateString()
  const isPast = targetDateObj < now && !isToday

  // Header with title and attendees
  const EventHeader = () => (
    <div className="text-center mb-4">
      {title && (
        <h2 className="text-3xl md:text-5xl font-extrabold text-zinc-900 dark:text-zinc-100 mb-3 tracking-tight">
          {title}
        </h2>
      )}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {attendeesCount !== undefined && attendeesCount > 0 && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {attendeesCount} {attendeesCount === 1 ? 'asistente' : 'asistentes'}
          </Badge>
        )}
      </div>
    </div>
  )

  // Cancelled state
  if (cancelled) {
    return (
      <Card className="bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700">
        <CardContent className="py-6">
          <EventHeader />
          <div className="text-center">
            <p className="text-2xl font-bold text-zinc-600 dark:text-zinc-400">
              😢 Se canceló la carnita...
            </p>
            <p className="text-lg text-zinc-500 dark:text-zinc-500 mt-2">
              ¡Otra será, amigos!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Past event
  if (isPast) {
    return (
      <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
        <CardContent className="py-6">
          <EventHeader />
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              🍖 ¡La carnita asada ya pasó!
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
              Esperamos que la hayan pasado increíble
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {formatDateTime(targetDate)}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Today / Expired (event is happening now)
  if (isExpired || isToday) {
    return (
      <Card className="bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
        <CardContent className="py-6">
          <EventHeader />
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              🔥 ¡Se armó la carnita asada!
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
              {formatDateTime(targetDate)}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Countdown (future event)
  return (
    <Card className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800">
      <CardContent className="py-6">
        <EventHeader />
        <div className="flex justify-center gap-4 md:gap-8">
          <TimeUnit value={days} label="días" />
          <TimeUnit value={hours} label="hrs" />
          <TimeUnit value={minutes} label="min" />
          <TimeUnit value={seconds} label="seg" />
        </div>
        <div className="text-center mt-4 space-y-1">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 capitalize">
            {formatDateOnly(targetDate)}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 uppercase">
            {formatTimeOnly(targetDate)}
          </p>
        </div>

        {location && mapsUrl && (
          <div className="mt-6 flex justify-center">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all group"
            >
              <MapPin className="h-4 w-4 text-red-500 group-hover:animate-bounce" />
              <span className="font-semibold text-sm">{location}</span>
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-3xl md:text-5xl font-bold text-orange-600 dark:text-orange-400 tabular-nums">
        {value.toString().padStart(2, '0')}
      </span>
      <span className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
    </div>
  )
}
