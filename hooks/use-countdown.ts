'use client'

import { useState, useEffect } from 'react'
import { calculateCountdown } from '@/lib/utils/date'

interface CountdownState {
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
}

export function useCountdown(targetDate: Date | string): CountdownState {
  const [timeLeft, setTimeLeft] = useState<CountdownState>(() =>
    calculateCountdown(targetDate)
  )

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateCountdown(targetDate))
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  return timeLeft
}
