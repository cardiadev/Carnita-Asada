'use client'

import { useCountdown } from '@/hooks/use-countdown'
import { formatDateTime } from '@/lib/utils/date'
import { Card, CardContent } from '@/components/ui/card'

interface CountdownProps {
  targetDate: Date | string
}

export function Countdown({ targetDate }: CountdownProps) {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(targetDate)

  if (isExpired) {
    return (
      <Card className="bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
        <CardContent className="py-6 text-center">
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            ¡Es hora de la carnita!
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
            {formatDateTime(targetDate)}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800">
      <CardContent className="py-6">
        <div className="flex justify-center gap-4 md:gap-8">
          <TimeUnit value={days} label="días" />
          <TimeUnit value={hours} label="hrs" />
          <TimeUnit value={minutes} label="min" />
          <TimeUnit value={seconds} label="seg" />
        </div>
        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400 mt-4 capitalize">
          {formatDateTime(targetDate)}
        </p>
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
