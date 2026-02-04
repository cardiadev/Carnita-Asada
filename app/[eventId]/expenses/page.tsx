'use client'

import { useState, useEffect, use, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils/currency'
import { formatShortDate } from '@/lib/utils/date'
import type { Expense, Attendee } from '@/types/database'

interface ExpensesPageProps {
  params: Promise<{ eventId: string }>
}

type ExpenseWithAttendee = Expense & {
  attendee: Attendee | null
}

export default function ExpensesPage({ params }: ExpensesPageProps) {
  const { eventId } = use(params)
  const [expenses, setExpenses] = useState<ExpenseWithAttendee[]>([])
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [eventUuid, setEventUuid] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Form state
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [attendeeId, setAttendeeId] = useState('')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener evento
        const eventRes = await fetch(`/api/events/${eventId}`)
        const eventData = await eventRes.json()
        if (eventRes.ok) {
          setEventUuid(eventData.id)
          setAttendees(eventData.attendees || [])
        }

        // Obtener gastos
        const expRes = await fetch(`/api/expenses?eventId=${eventId}`)
        const expData = await expRes.json()
        if (expRes.ok) setExpenses(expData)
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Error al cargar los datos')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [eventId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!description.trim()) {
      toast.error('Por favor ingresa una descripción')
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Por favor ingresa un monto válido')
      return
    }

    if (!eventUuid) {
      toast.error('Error: no se pudo obtener el ID del evento')
      return
    }

    setIsSubmitting(true)

    try {
      let receiptUrl: string | undefined

      // Subir comprobante si hay
      if (receiptFile) {
        const formData = new FormData()
        formData.append('file', receiptFile)
        formData.append('eventId', eventUuid)

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        const uploadData = await uploadRes.json()

        if (!uploadRes.ok) {
          throw new Error(uploadData.error || 'Error al subir comprobante')
        }

        receiptUrl = uploadData.url
      }

      // Crear gasto
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: eventUuid,
          attendeeId: attendeeId || undefined,
          description: description.trim(),
          amount: parseFloat(amount),
          receiptUrl,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al registrar gasto')
      }

      setExpenses([data, ...expenses])
      setDescription('')
      setAmount('')
      setAttendeeId('')
      setReceiptFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setIsDialogOpen(false)
      toast.success('Gasto registrado')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al registrar gasto')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este gasto?')) return

    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setExpenses(expenses.filter(e => e.id !== id))
      toast.success('Gasto eliminado')
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Gastos
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {expenses.length} {expenses.length === 1 ? 'gasto' : 'gastos'} registrados
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700">
              + Agregar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar gasto</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Ej: Carne para la parrilla"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Monto</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isSubmitting}
                  min="0.01"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="attendee">¿Quién compró?</Label>
                <Select value={attendeeId} onValueChange={setAttendeeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar persona" />
                  </SelectTrigger>
                  <SelectContent>
                    {attendees.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="receipt">Comprobante (opcional)</Label>
                <Input
                  id="receipt"
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  disabled={isSubmitting}
                />
                {receiptFile && (
                  <p className="text-sm text-zinc-500">{receiptFile.name}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar gasto'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Total */}
      <Card className="mb-6 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
        <CardContent className="py-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Total gastado</p>
          <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
            {formatCurrency(totalExpenses)}
          </p>
        </CardContent>
      </Card>

      {/* Lista de gastos */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <div className="h-16 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : expenses.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-zinc-500 dark:text-zinc-400">
            <p>No hay gastos registrados</p>
            <p className="text-sm mt-1">Agrega los gastos de la carnita</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => (
            <Card key={expense.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {expense.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      {expense.attendee && (
                        <span className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                          </svg>
                          {expense.attendee.name}
                        </span>
                      )}
                      <span>·</span>
                      <span>{formatShortDate(expense.created_at)}</span>
                    </div>
                    {expense.receipt_url && (
                      <a
                        href={expense.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-orange-600 hover:underline mt-1 inline-block"
                      >
                        Ver comprobante
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(Number(expense.amount))}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(expense.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"/>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                      </svg>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
