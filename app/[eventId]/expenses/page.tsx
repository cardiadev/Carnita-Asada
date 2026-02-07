'use client'

import { useState, useEffect, use, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { CurrencyInput } from '@/components/ui/currency-input'
import { ReceiptModal } from '@/components/receipt-modal'
import { toast } from 'sonner'
import { Pencil, Trash2, User, FileText } from 'lucide-react'
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
  const [receiptFiles, setReceiptFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Edit state
  const [editingExpense, setEditingExpense] = useState<ExpenseWithAttendee | null>(null)
  const [editDescription, setEditDescription] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editAttendeeId, setEditAttendeeId] = useState('')
  const [editReceiptFiles, setEditReceiptFiles] = useState<File[]>([])
  const [editReceiptUrl, setEditReceiptUrl] = useState<string | null>(null)
  const [deleteReceipt, setDeleteReceipt] = useState(false)
  const [isEditSaving, setIsEditSaving] = useState(false)
  const editFileInputRef = useRef<HTMLInputElement>(null)

  // Receipt modal state
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null)

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
      const receiptUrls: string[] = []

      // Subir todos los comprobantes seleccionados
      if (receiptFiles.length > 0 && eventUuid) {
        for (const file of receiptFiles) {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('eventId', eventUuid)

          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          })

          const uploadData = await uploadRes.json()
          if (uploadRes.ok) {
            receiptUrls.push(uploadData.url)
          } else {
            console.error('Error uploading file:', uploadData.error)
            toast.error(`Error al subir ${file.name}`)
          }
        }
      }

      // Crear gasto (guardamos URLs como JSON si son varias)
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: eventUuid,
          attendeeId: attendeeId || undefined,
          description: description.trim(),
          amount: parseFloat(amount),
          receiptUrl: receiptUrls.length > 0 ? JSON.stringify(receiptUrls) : undefined,
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
      setReceiptFiles([])
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

  const handleEditClick = (expense: ExpenseWithAttendee) => {
    setEditingExpense(expense)
    setEditDescription(expense.description)
    setEditAmount(String(expense.amount))
    setEditAttendeeId(expense.attendee_id || '')
    setEditReceiptUrl(expense.receipt_url || null) // This could be a JSON string
    setEditReceiptFiles([])
    setDeleteReceipt(false)
    if (editFileInputRef.current) editFileInputRef.current.value = ''
  }

  const handleSaveEdit = async () => {
    if (!editingExpense || !editDescription.trim() || !editAmount) return

    setIsEditSaving(true)
    try {
      // Parse current URLs if they exist
      let currentUrls: string[] = []
      if (editReceiptUrl) {
        try {
          currentUrls = JSON.parse(editReceiptUrl)
          if (!Array.isArray(currentUrls)) currentUrls = [editReceiptUrl]
        } catch {
          currentUrls = [editReceiptUrl]
        }
      }

      const receiptUrlsToKeep = deleteReceipt ? [] : [...currentUrls]

      // Upload new receipts
      if (editReceiptFiles.length > 0 && eventUuid) {
        for (const file of editReceiptFiles) {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('eventId', eventUuid)

          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          })

          const uploadData = await uploadRes.json()
          if (uploadRes.ok) {
            receiptUrlsToKeep.push(uploadData.url)
          } else {
            toast.error(`Error al subir ${file.name}`)
          }
        }
      }

      const finalReceiptUrl = receiptUrlsToKeep.length > 0
        ? JSON.stringify(receiptUrlsToKeep)
        : null

      const res = await fetch(`/api/expenses/${editingExpense.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: editDescription.trim(),
          amount: parseFloat(editAmount),
          attendeeId: editAttendeeId || null,
          receiptUrl: finalReceiptUrl,
        }),
      })

      if (!res.ok) throw new Error()

      const updatedExpense = await res.json()
      setExpenses(expenses.map(e =>
        e.id === editingExpense.id ? updatedExpense : e
      ))
      setEditingExpense(null)
      toast.success('Gasto actualizado')
    } catch {
      toast.error('Error al actualizar')
    } finally {
      setIsEditSaving(false)
    }
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

  // Agrupar gastos por persona
  const expensesByPerson = expenses.reduce((acc, expense) => {
    const personId = expense.attendee_id || 'sin-asignar'
    const personName = expense.attendee?.name || 'Sin asignar'

    if (!acc[personId]) {
      acc[personId] = {
        personId,
        personName,
        total: 0,
        expenses: []
      }
    }

    acc[personId].total += Number(expense.amount)
    acc[personId].expenses.push(expense)

    return acc
  }, {} as Record<string, { personId: string; personName: string; total: number; expenses: ExpenseWithAttendee[] }>)

  // Ordenar por total (mayor a menor)
  const sortedGroups = Object.values(expensesByPerson).sort((a, b) => b.total - a.total)

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Header: Stack on mobile, horizontal on desktop */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-0 mb-6">
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
            <Button variant="outline" className="w-full md:w-auto bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 font-bold text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-all">
              <span className="md:hidden">+ Agregar gasto</span>
              <span className="hidden md:inline">+ Agregar</span>
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
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Monto</Label>
                <CurrencyInput
                  id="amount"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isSubmitting}
                  min="0.01"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="attendee">¿Quién compró?</Label>
                <Select value={attendeeId} onValueChange={setAttendeeId}>
                  <SelectTrigger className="w-full">
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
                <Label htmlFor="receipt">Comprobantes (opcional)</Label>
                <Input
                  id="receipt"
                  type="file"
                  accept="image/*"
                  multiple
                  ref={fileInputRef}
                  onChange={(e) => {
                    const files = e.target.files
                    if (files) {
                      setReceiptFiles(prev => [...prev, ...Array.from(files)])
                    }
                  }}
                  disabled={isSubmitting}
                  className="w-full"
                />
                {receiptFiles.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {receiptFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/10 p-2 rounded-md overflow-hidden min-w-0 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors"
                        onClick={() => {
                          const url = URL.createObjectURL(file);
                          setSelectedReceipt(url);
                        }}
                      >
                        <FileText className="h-4 w-4 shrink-0" />
                        <span className="flex-1 text-xs sm:text-sm line-clamp-2 break-all min-w-0 font-medium">{file.name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReceiptFiles(prev => prev.filter((_, i) => i !== index));
                          }}
                          className="text-red-500 hover:text-red-600 shrink-0 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-800/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  type="submit"
                  variant="outline"
                  disabled={isSubmitting}
                  className="w-full bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 font-bold text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-all"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar gasto'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="w-full"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Total */}
      <Card className="mb-6 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
        <CardContent className="p-4">
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
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-48 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                    <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                  </div>
                  <div className="h-6 w-20 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : expenses.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-zinc-500 dark:text-zinc-400">
            <p>No hay gastos registrados</p>
            <p className="text-sm mt-1">Agrega los gastos de la carnita</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedGroups.map((group) => (
            <Card key={group.personId} className="overflow-hidden">
              {/* Header de persona con total */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <User className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {group.personName}
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {group.expenses.length} {group.expenses.length === 1 ? 'gasto' : 'gastos'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                    {formatCurrency(group.total)}
                  </p>
                </div>
              </div>

              {/* Lista de gastos de esta persona */}
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {group.expenses.map((expense) => (
                  <div key={expense.id} className="p-4">
                    {/* ===== MOBILE LAYOUT ===== */}
                    <div className="flex flex-col gap-3 md:hidden">
                      {/* Row 1: Description + Amount */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {expense.description}
                          </p>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                            {formatShortDate(expense.created_at)}
                          </p>
                        </div>
                        <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 shrink-0">
                          {formatCurrency(Number(expense.amount))}
                        </p>
                      </div>

                      {/* Row 2: Receipt button (full width) */}
                      {expense.receipt_url && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedReceipt(expense.receipt_url!)}
                          className="w-full h-9 text-sm gap-1.5"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Ver comprobante
                        </Button>
                      )}

                      {/* Row 3: Action buttons (distributed) */}
                      <div className="flex items-center justify-between gap-2 -mx-2 px-2">
                        <Button
                          variant="ghost"
                          onClick={() => handleEditClick(expense)}
                          title="Editar"
                          className="flex-1 h-10 gap-2"
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="text-sm">Editar</span>
                        </Button>
                        <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700" />
                        <Button
                          variant="ghost"
                          onClick={() => handleDelete(expense.id)}
                          className="flex-1 h-10 gap-2 text-red-500 hover:text-red-600"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="text-sm">Borrar</span>
                        </Button>
                      </div>
                    </div>

                    {/* ===== DESKTOP LAYOUT ===== */}
                    <div className="hidden md:flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {expense.description}
                        </p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                          {formatShortDate(expense.created_at)}
                        </p>
                        {expense.receipt_url && (
                          <div className="mt-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setSelectedReceipt(expense.receipt_url!)}
                              className="h-8 text-sm gap-1.5"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              Ver comprobante
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                          {formatCurrency(Number(expense.amount))}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(expense)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(expense.id)}
                          className="text-red-500 hover:text-red-600"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingExpense} onOpenChange={() => setEditingExpense(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar gasto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editDescription">Descripción</Label>
              <Textarea
                id="editDescription"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                disabled={isEditSaving}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editAmount">Monto</Label>
              <CurrencyInput
                id="editAmount"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                disabled={isEditSaving}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editAttendee">¿Quién pagó?</Label>
              <Select value={editAttendeeId} onValueChange={setEditAttendeeId} disabled={isEditSaving}>
                <SelectTrigger id="editAttendee" className="w-full">
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

            {/* Receipt management */}
            <div className="space-y-2">
              <Label>Comprobantes actuales</Label>
              {(() => {
                let urls: string[] = []
                if (editReceiptUrl) {
                  try {
                    urls = JSON.parse(editReceiptUrl)
                    if (!Array.isArray(urls)) urls = [editReceiptUrl]
                  } catch {
                    urls = [editReceiptUrl]
                  }
                }

                if (urls.length === 0 || deleteReceipt) {
                  if (deleteReceipt) {
                    return (
                      <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <span className="flex-1 text-sm text-red-600 dark:text-red-400">
                          Se eliminarán todos los comprobantes actuales
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteReceipt(false)}
                          className="shrink-0"
                          disabled={isEditSaving}
                        >
                          Deshacer
                        </Button>
                      </div>
                    )
                  }
                  return <p className="text-sm text-zinc-500 italic">No hay comprobantes</p>
                }

                return (
                  <div className="space-y-2">
                    {urls.map((url, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden group hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                        onClick={() => setSelectedReceipt(url)}
                      >
                        <FileText className="h-5 w-5 text-zinc-500 shrink-0" />
                        <span className="flex-1 text-sm line-clamp-2 break-all min-w-0 font-medium">
                          Comprobante {urls.length > 1 ? idx + 1 : ''}
                        </span>
                        {urls.length === 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteReceipt(true);
                            }}
                            className="shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            disabled={isEditSaving}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {urls.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteReceipt(true)}
                        className="w-full text-red-500 hover:text-red-600 border border-red-100 dark:border-red-900/30"
                        disabled={isEditSaving}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar todos
                      </Button>
                    )}
                  </div>
                )
              })()}

              <div className="space-y-1 pt-2">
                <Label htmlFor="editReceipt" className="text-sm text-zinc-500">
                  {editReceiptUrl && !deleteReceipt ? 'Agregar más comprobantes' : 'Subir comprobantes'}
                </Label>
                <Input
                  id="editReceipt"
                  type="file"
                  accept="image/*"
                  multiple
                  ref={editFileInputRef}
                  onChange={(e) => {
                    const files = e.target.files
                    if (files) {
                      setEditReceiptFiles(prev => [...prev, ...Array.from(files)])
                      setDeleteReceipt(false)
                    }
                  }}
                  disabled={isEditSaving}
                  className="w-full"
                />
                {editReceiptFiles.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {editReceiptFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/10 p-2 rounded-md overflow-hidden min-w-0 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors"
                        onClick={() => {
                          const url = URL.createObjectURL(file);
                          setSelectedReceipt(url);
                        }}
                      >
                        <FileText className="h-4 w-4 shrink-0" />
                        <span className="flex-1 text-xs sm:text-sm line-clamp-2 break-all min-w-0 font-medium">{file.name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditReceiptFiles(prev => prev.filter((_, i) => i !== index));
                          }}
                          className="text-red-500 hover:text-red-600 shrink-0 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-800/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              variant="outline"
              onClick={handleSaveEdit}
              disabled={isEditSaving}
              className="w-full bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 font-bold text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-all"
            >
              {isEditSaving ? 'Guardando...' : 'Guardar'}
            </Button>
            <Button variant="outline" onClick={() => setEditingExpense(null)} className="w-full">
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        receiptUrl={selectedReceipt || ''}
      />
    </div>
  )
}

