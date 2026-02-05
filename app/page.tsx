'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { toast } from 'sonner'
import { MapPin, Beef, Heart } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
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
          location: location.trim() || null,
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
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-6 shadow-orange-200 dark:shadow-orange-900/20 shadow-xl animate-bounce-slow">
            <Beef className="h-12 w-12 text-orange-600 dark:text-orange-400" />
          </div>
          <h1 className="text-6xl font-black text-orange-600 dark:text-orange-400 mb-3 tracking-tight">
            Carnita Asada
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 font-medium">
            Organiza tu parrillada sin tanta complicación
          </p>
        </div>

        <Card className="w-full max-w-md shadow-2xl shadow-orange-200/50 dark:shadow-zinc-950/50 border-orange-100 dark:border-zinc-800 border-2">
          <CardHeader className="p-8 pb-6 space-y-3">
            <CardTitle className="text-3xl font-bold tracking-tight">Crear nuevo evento</CardTitle>
            <CardDescription className="text-base text-zinc-500 dark:text-zinc-400">
              Ingresa los datos de tu carnita asada para comenzar
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="title" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Nombre del evento
                </Label>
                <Input
                  id="title"
                  placeholder="Ej: Carnita con los Reales"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Fecha y hora
                </Label>
                <DateTimePicker
                  value={eventDate}
                  onChange={setEventDate}
                  minDate={new Date()}
                  disabled={isLoading}
                  placeholder="Seleccionar fecha y hora"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="location" className="flex items-center gap-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  <MapPin className="h-4 w-4 text-orange-500" />
                  Ubicación <span className="text-zinc-400 text-xs font-normal">(opcional)</span>
                </Label>
                <Input
                  id="location"
                  placeholder="Ej: Casa de Vivi, Parque Central"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 py-6 text-base font-bold shadow-lg shadow-orange-200 dark:shadow-none transition-all active:scale-[0.98]"
                disabled={isLoading}
              >
                {isLoading ? 'Creando...' : 'Crear Carnita Asada'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <footer className="mt-16 text-center text-sm text-zinc-500 dark:text-zinc-400 flex flex-col items-center gap-1">
          <p className="flex items-center gap-1.5 font-medium italic">
            Creado con amor <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500 animate-pulse" /> por{' '}
            <a
              href="https://carlosdiaz.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 dark:text-orange-400 hover:underline font-bold not-italic"
            >
              Carlos Díaz
            </a>
          </p>
          <a
            href="https://github.com/cardiadev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-orange-600 transition-colors"
          >
            @cardiadev
          </a>
        </footer>
      </main>
    </div>
  )
}
