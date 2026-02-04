'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { toast } from 'sonner'

export default function Home() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [eventDate, setEventDate] = useState<Date | undefined>(undefined)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Por favor ingresa un título para tu carnita')
      return
    }

    if (!eventDate) {
      toast.error('Por favor selecciona la fecha del evento')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          eventDate: eventDate.toISOString(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear el evento')
      }

      toast.success('¡Evento creado!')
      router.push(`/${data.nanoId}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear el evento')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-100 dark:from-zinc-900 dark:to-zinc-800">
      <main className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-screen">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-orange-600 dark:text-orange-400 mb-2">
            Carnita Asada
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Organiza tu parrillada con amigos
          </p>
        </div>

        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Crear nuevo evento</CardTitle>
            <CardDescription>
              Ingresa los datos de tu carnita asada para comenzar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Nombre del evento</Label>
                <Input
                  id="title"
                  placeholder="Ej: Carnita de cumpleaños de Juan"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label>Fecha y hora</Label>
                <DateTimePicker
                  value={eventDate}
                  onChange={setEventDate}
                  minDate={new Date()}
                  disabled={isLoading}
                  placeholder="Seleccionar fecha y hora"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700"
                disabled={isLoading}
              >
                {isLoading ? 'Creando...' : 'Crear Carnita Asada'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <footer className="mt-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
          <p>
            Creado por{' '}
            <a
              href="https://github.com/cardiadev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:underline"
            >
              @cardiadev
            </a>
            {' '}(Carlos Díaz)
          </p>
        </footer>
      </main>
    </div>
  )
}
