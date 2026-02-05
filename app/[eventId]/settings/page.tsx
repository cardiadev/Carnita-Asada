'use client'

import { useState, useEffect, use } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { Save, MapPin, Calendar, Clock, FileText, Link2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toDateTimeLocal } from '@/lib/utils/date'

interface SettingsPageProps {
    params: Promise<{ eventId: string }>
}

interface EventData {
    id: string
    nanoId: string
    title: string
    eventDate: string
    location: string | null
    description: string | null
    mapsUrl: string | null
}

export default function SettingsPage({ params }: SettingsPageProps) {
    const { eventId } = use(params)
    const [event, setEvent] = useState<EventData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    // Form state
    const [title, setTitle] = useState('')
    const [eventDate, setEventDate] = useState('')
    const [location, setLocation] = useState('')
    const [description, setDescription] = useState('')
    const [mapsUrl, setMapsUrl] = useState('')

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await fetch(`/api/events/${eventId}`)
                const data = await res.json()
                if (res.ok) {
                    setEvent(data)
                    setTitle(data.title || '')
                    setEventDate(data.eventDate ? toDateTimeLocal(new Date(data.eventDate)) : '')
                    setLocation(data.location || '')
                    setDescription(data.description || '')
                    setMapsUrl(data.mapsUrl || '')
                }
            } catch (error) {
                console.error('Error fetching event:', error)
                toast.error('Error al cargar el evento')
            } finally {
                setIsLoading(false)
            }
        }

        fetchEvent()
    }, [eventId])

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error('El título es requerido')
            return
        }

        setIsSaving(true)

        try {
            const res = await fetch(`/api/events/${eventId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    eventDate: eventDate ? new Date(eventDate).toISOString() : undefined,
                    location: location.trim() || null,
                    description: description.trim() || null,
                    mapsUrl: mapsUrl.trim() || null,
                }),
            })

            if (!res.ok) {
                throw new Error('Error al guardar')
            }

            toast.success('Cambios guardados')
        } catch (error) {
            console.error('Error saving:', error)
            toast.error('Error al guardar los cambios')
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-6 max-w-2xl">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48 mb-6" />
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-6 max-w-2xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    Ajustes del Evento
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Edita la información de tu carnita asada
                </p>
            </div>

            {/* Información básica */}
            <Card className="mb-6 overflow-hidden">
                <CardHeader className="p-4 pb-2 border-b border-zinc-50 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800/20">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-orange-500" />
                        Información del Evento
                    </CardTitle>
                    <CardDescription>
                        Datos principales de tu carnita asada
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Título del evento</Label>
                        <Input
                            id="title"
                            placeholder="Ej: Carnita en casa de Juan"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="eventDate" className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4" />
                                Fecha y Hora
                            </Label>
                            <Input
                                id="eventDate"
                                type="datetime-local"
                                value={eventDate}
                                onChange={(e) => setEventDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location" className="flex items-center gap-1.5">
                                <MapPin className="h-4 w-4" />
                                Ubicación
                            </Label>
                            <Input
                                id="location"
                                placeholder="Ej: Casa de Juan"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="mapsUrl" className="flex items-center gap-1.5">
                            <Link2 className="h-4 w-4" />
                            Link de Google Maps
                        </Label>
                        <Input
                            id="mapsUrl"
                            type="url"
                            placeholder="https://maps.google.com/..."
                            value={mapsUrl}
                            onChange={(e) => setMapsUrl(e.target.value)}
                        />
                        <p className="text-xs text-zinc-500">
                            Pega el link de Google Maps para que los invitados puedan llegar fácilmente
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Descripción y avisos */}
            <Card className="mb-6 overflow-hidden">
                <CardHeader className="p-4 pb-2 border-b border-zinc-50 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800/20">
                    <CardTitle className="text-lg">Descripción y Avisos</CardTitle>
                    <CardDescription>
                        Agrega notas importantes para los asistentes
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                            id="description"
                            placeholder="Ej: Cada quien lleva su carne. Hay asador disponible. Llevar sillas..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Guardar */}
            <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-orange-600 hover:bg-orange-700"
                size="lg"
            >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
        </div>
    )
}
