'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { toast } from 'sonner'
import { MapPin, Beef } from 'lucide-react'

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
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left: Form */}
      <div className="flex flex-col gap-4 p-6 md:p-10">
        {/* Mobile header */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
            <Beef className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </div>
          <span className="text-lg font-bold text-orange-600 dark:text-orange-400">Carnita Asada</span>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Crear nuevo evento
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400">
                Ingresa los datos de tu carnita asada para comenzar
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
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

              <div className="space-y-2">
                <Label className="text-sm font-medium">
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

              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-1 text-sm font-medium">
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
                variant="outline"
                className="w-full bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 font-bold text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-all"
                disabled={isLoading}
              >
                {isLoading ? 'Creando...' : 'Crear Carnita Asada'}
              </Button>
            </form>

            <div className="text-center text-sm text-zinc-500 dark:text-zinc-400 pt-4 space-y-1">
              <p>
                Creado con <span className="text-red-500">❤️</span> por{' '}
                <a
                  href="https://carlosdiaz.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-zinc-700 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                >
                  Carlos Diaz
                </a>
              </p>
              <p>
                <a
                  href="https://github.com/cardiadev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-zinc-700 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                >
                  @cardiadev
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Branding */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-gradient-to-b from-orange-50 to-amber-100 dark:from-zinc-900 dark:to-zinc-800 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-orange-200/30 dark:bg-orange-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-amber-200/40 dark:bg-amber-900/20 rounded-full blur-2xl" />

        <div className="relative z-10 text-center">
          <div className="w-32 h-32 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-8 mx-auto shadow-xl shadow-orange-200/50 dark:shadow-orange-900/20 animate-bounce-slow">
            <Beef className="h-16 w-16 text-orange-600 dark:text-orange-400" />
          </div>
          <h2 className="text-6xl font-black text-orange-600 dark:text-orange-400 mb-4 tracking-tight">
            Carnita Asada
          </h2>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 font-medium">
            Sin tanta complicación
          </p>
        </div>
      </div>
    </div>
  )
}
