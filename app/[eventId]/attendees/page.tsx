'use client'

import { useState, useEffect, use } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { BackButton } from '@/components/common/back-button'
import { Pencil, Trash2, UserMinus, UserPlus, CreditCard } from 'lucide-react'
import type { Attendee } from '@/types/database'

interface AttendeePageProps {
  params: Promise<{ eventId: string }>
}

interface BankInfo {
  id?: string
  holder_name: string
  bank_name: string
  clabe: string
  account_number?: string
}

export default function AttendeesPage({ params }: AttendeePageProps) {
  const { eventId } = use(params)
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [newName, setNewName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [eventUuid, setEventUuid] = useState<string | null>(null)

  // Edit state
  const [editingAttendee, setEditingAttendee] = useState<Attendee | null>(null)
  const [editName, setEditName] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  // Bank info state
  const [bankDialogOpen, setBankDialogOpen] = useState(false)
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null)
  const [bankInfo, setBankInfo] = useState<BankInfo>({
    holder_name: '',
    bank_name: '',
    clabe: '',
    account_number: '',
  })
  const [isSavingBank, setIsSavingBank] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventRes = await fetch(`/api/events/${eventId}`)
        const eventData = await eventRes.json()
        if (eventRes.ok) {
          setEventUuid(eventData.id)
        }

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

  const handleEditClick = (attendee: Attendee) => {
    setEditingAttendee(attendee)
    setEditName(attendee.name)
  }

  const handleSaveEdit = async () => {
    if (!editingAttendee || !editName.trim()) return

    setIsEditing(true)
    try {
      const res = await fetch(`/api/attendees/${editingAttendee.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      })

      if (!res.ok) throw new Error('Error al actualizar')

      setAttendees(attendees.map(a =>
        a.id === editingAttendee.id ? { ...a, name: editName.trim() } : a
      ))
      setEditingAttendee(null)
      toast.success('Nombre actualizado')
    } catch {
      toast.error('Error al actualizar')
    } finally {
      setIsEditing(false)
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

      if (!res.ok) throw new Error('Error al actualizar')

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

      if (!res.ok) throw new Error('Error al eliminar')

      setAttendees(attendees.filter(a => a.id !== id))
      toast.success('Asistente eliminado')
    } catch {
      toast.error('Error al eliminar asistente')
    }
  }

  const handleBankClick = async (attendee: Attendee) => {
    setSelectedAttendee(attendee)
    setBankInfo({
      holder_name: '',
      bank_name: '',
      clabe: '',
      account_number: '',
    })

    // Fetch existing bank info
    try {
      const res = await fetch(`/api/bank-info?attendeeId=${attendee.id}`)
      const data = await res.json()
      if (data) {
        setBankInfo({
          id: data.id,
          holder_name: data.holder_name || '',
          bank_name: data.bank_name || '',
          clabe: data.clabe || '',
          account_number: data.account_number || '',
        })
      }
    } catch {
      // No existing bank info
    }

    setBankDialogOpen(true)
  }

  const handleSaveBankInfo = async () => {
    if (!selectedAttendee || !bankInfo.holder_name || !bankInfo.bank_name || !bankInfo.clabe) {
      toast.error('Por favor completa los campos requeridos')
      return
    }

    setIsSavingBank(true)
    try {
      const res = await fetch('/api/bank-info', {
        method: bankInfo.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: bankInfo.id,
          attendeeId: selectedAttendee.id,
          ...bankInfo,
        }),
      })

      if (!res.ok) throw new Error('Error al guardar')

      toast.success('Datos bancarios guardados')
      setBankDialogOpen(false)
    } catch {
      toast.error('Error al guardar datos bancarios')
    } finally {
      setIsSavingBank(false)
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
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
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

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditClick(attendee)}
                      title="Editar nombre"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleBankClick(attendee)}
                      title="Datos bancarios"
                    >
                      <CreditCard className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleExclusion(attendee)}
                      title={attendee.exclude_from_split ? 'Incluir en división' : 'Excluir de división'}
                    >
                      {attendee.exclude_from_split ? (
                        <UserPlus className="h-4 w-4" />
                      ) : (
                        <UserMinus className="h-4 w-4" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(attendee.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingAttendee} onOpenChange={() => setEditingAttendee(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar asistente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Nombre</Label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={isEditing}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAttendee(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={isEditing} className="bg-orange-600 hover:bg-orange-700">
              {isEditing ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bank Info Dialog */}
      <Dialog open={bankDialogOpen} onOpenChange={setBankDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Datos bancarios de {selectedAttendee?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="holder_name">Nombre del titular *</Label>
              <Input
                id="holder_name"
                value={bankInfo.holder_name}
                onChange={(e) => setBankInfo({ ...bankInfo, holder_name: e.target.value })}
                placeholder="Nombre completo"
                disabled={isSavingBank}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_name">Banco *</Label>
              <Input
                id="bank_name"
                value={bankInfo.bank_name}
                onChange={(e) => setBankInfo({ ...bankInfo, bank_name: e.target.value })}
                placeholder="Ej: BBVA, Banorte, etc."
                disabled={isSavingBank}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clabe">CLABE interbancaria *</Label>
              <Input
                id="clabe"
                value={bankInfo.clabe}
                onChange={(e) => setBankInfo({ ...bankInfo, clabe: e.target.value })}
                placeholder="18 dígitos"
                maxLength={18}
                disabled={isSavingBank}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account_number">Número de cuenta (opcional)</Label>
              <Input
                id="account_number"
                value={bankInfo.account_number}
                onChange={(e) => setBankInfo({ ...bankInfo, account_number: e.target.value })}
                placeholder="Número de cuenta"
                disabled={isSavingBank}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBankDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveBankInfo} disabled={isSavingBank} className="bg-orange-600 hover:bg-orange-700">
              {isSavingBank ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
