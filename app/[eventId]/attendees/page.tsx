'use client'

import { useState, useEffect, use } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { BackButton } from '@/components/common/back-button'
import type { Attendee } from '@/types/database'

interface AttendeePageProps {
  params: Promise<{ eventId: string }>
}

export default function AttendeesPage({ params }: AttendeePageProps) {
  const { eventId } = use(params)
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [newName, setNewName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [eventUuid, setEventUuid] = useState<string | null>(null)

  // Cargar asistentes y obtener UUID del evento
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener datos del evento para el UUID
        const eventRes = await fetch(`/api/events/${eventId}`)
        const eventData = await eventRes.json()
        if (eventRes.ok) {
          setEventUuid(eventData.id)
        }

        // Obtener asistentes
        const res = await fetch(`/api/attendees?eventId=${eventId}`)
        const data = await res.json()
        if (res.ok) {
          setAttendees(data)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Error al cargar los datos')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [eventId])

  const handleAddAttendee = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newName.trim()) {
      toast.error('Por favor ingresa un nombre')
      return
    }

    if (!eventUuid) {
      toast.error('Error: no se pudo obtener el ID del evento')
      return
    }

    setIsAdding(true)

    try {
      const res = await fetch('/api/attendees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: eventUuid,
          name: newName.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al agregar asistente')
      }

      setAttendees([...attendees, data])
      setNewName('')
      toast.success('Asistente agregado')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al agregar asistente')
    } finally {
      setIsAdding(false)
    }
  }

  const handleToggleExclusion = async (attendee: Attendee) => {
    try {
      const res = await fetch(`/api/attendees/${attendee.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          excludeFromSplit: !attendee.exclude_from_split,
        }),
      })

      if (!res.ok) {
        throw new Error('Error al actualizar')
      }

      setAttendees(attendees.map(a =>
        a.id === attendee.id
          ? { ...a, exclude_from_split: !a.exclude_from_split }
          : a
      ))

      toast.success(
        attendee.exclude_from_split
          ? 'Incluido en la división'
          : 'Excluido de la división'
      )
    } catch {
      toast.error('Error al actualizar asistente')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este asistente?')) return

    try {
      const res = await fetch(`/api/attendees/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Error al eliminar')
      }

      setAttendees(attendees.filter(a => a.id !== id))
      toast.success('Asistente eliminado')
    } catch {
      toast.error('Error al eliminar asistente')
    }
  }

  const activeCount = attendees.filter(a => !a.exclude_from_split).length

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <BackButton />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Asistentes
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {attendees.length} total · {activeCount} en la división
        </p>
      </div>

      {/* Formulario agregar */}
      <form onSubmit={handleAddAttendee} className="flex gap-2 mb-6">
        <Input
          placeholder="Nombre del asistente"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          disabled={isAdding}
        />
        <Button
          type="submit"
          disabled={isAdding}
          className="bg-orange-600 hover:bg-orange-700 shrink-0"
        >
          {isAdding ? 'Agregando...' : 'Agregar'}
        </Button>
      </form>

      {/* Lista de asistentes */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : attendees.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-zinc-500 dark:text-zinc-400">
            <p>No hay asistentes todavía</p>
            <p className="text-sm mt-1">Agrega a las personas que irán a la carnita</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {attendees.map((attendee) => (
            <Card key={attendee.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-medium">
                    {attendee.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {attendee.name}
                    </p>
                    {attendee.exclude_from_split && (
                      <Badge variant="secondary" className="text-xs">
                        Excluido de división
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleExclusion(attendee)}
                    title={attendee.exclude_from_split ? 'Incluir en división' : 'Excluir de división'}
                  >
                    {attendee.exclude_from_split ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <line x1="17" x2="22" y1="11" y2="11" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <line x1="19" x2="19" y1="8" y2="14" />
                        <line x1="22" x2="16" y1="11" y2="11" />
                      </svg>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(attendee.id)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
