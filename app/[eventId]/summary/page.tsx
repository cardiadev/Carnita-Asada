'use client'

import { useState, useEffect, use } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Copy, Check, MessageCircle, CheckCircle2, Undo2, UserCheck, UserX, DollarSign, Users, UserPlus, UserMinus, CreditCard } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import type { Expense, Attendee } from '@/types/database'

interface SummaryPageProps {
  params: Promise<{ eventId: string }>
}

type ExpenseWithAttendee = Expense & {
  attendee: Attendee | null
}

interface BankInfo {
  id: string
  attendee_id: string
  holder_name: string
  bank_name: string
  clabe: string
  account_number: string | null
}

interface Payment {
  id: string
  event_id: string
  from_attendee_id: string
  to_attendee_id: string
  amount: number
  status: string
}

interface PersonBalance {
  attendee: Attendee
  paid: number
  owes: number
  balance: number
  paidToOthers: number  // Amount paid via transfers
  receivedFromOthers: number  // Amount received via transfers
  netBalance: number  // balance + paidToOthers - receivedFromOthers
  bankInfo?: BankInfo | null
}

export default function SummaryPage({ params }: SummaryPageProps) {
  const { eventId } = use(params)
  const [expenses, setExpenses] = useState<ExpenseWithAttendee[]>([])
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [bankInfoMap, setBankInfoMap] = useState<Record<string, BankInfo>>({})
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [savingPayment, setSavingPayment] = useState<string | null>(null)
  const [showBankInfoModal, setShowBankInfoModal] = useState(false)
  const [selectedBankInfo, setSelectedBankInfo] = useState<{ name: string; info: BankInfo } | null>(null)

  // Add bank info modal state
  const [showAddBankModal, setShowAddBankModal] = useState(false)
  const [addBankAttendee, setAddBankAttendee] = useState<Attendee | null>(null)
  const [newBankInfo, setNewBankInfo] = useState({
    holder_name: '',
    bank_name: '',
    clabe: '',
    account_number: '',
  })
  const [isSavingBank, setIsSavingBank] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener evento con asistentes
        const eventRes = await fetch(`/api/events/${eventId}`)
        const eventData = await eventRes.json()
        if (eventRes.ok) {
          setAttendees(eventData.attendees || [])

          // Obtener info bancaria de cada asistente
          const bankInfoPromises = eventData.attendees.map(async (a: Attendee) => {
            const res = await fetch(`/api/bank-info?attendeeId=${a.id}`)
            if (res.ok) {
              const data = await res.json()
              return data ? { [a.id]: data } : null
            }
            return null
          })

          const bankInfoResults = await Promise.all(bankInfoPromises)
          const bankInfoObj = bankInfoResults.reduce((acc, item) => {
            if (item) return { ...acc, ...item }
            return acc
          }, {} as Record<string, BankInfo>)

          setBankInfoMap(bankInfoObj)
        }

        // Obtener gastos
        const expRes = await fetch(`/api/expenses?eventId=${eventId}`)
        const expData = await expRes.json()
        if (expRes.ok) setExpenses(expData)

        // Obtener pagos guardados
        const paymentsRes = await fetch(`/api/payments?eventId=${eventId}`)
        const paymentsData = await paymentsRes.json()
        if (paymentsRes.ok) setPayments(paymentsData)
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Error al cargar los datos')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [eventId])

  // Check if a transfer is paid
  const isTransferPaid = (fromId: string, toId: string) => {
    return payments.some(p =>
      p.from_attendee_id === fromId &&
      p.to_attendee_id === toId &&
      p.status === 'completed'
    )
  }

  // Get payment ID for a transfer
  const getPaymentId = (fromId: string, toId: string) => {
    const payment = payments.find(p =>
      p.from_attendee_id === fromId && p.to_attendee_id === toId
    )
    return payment?.id
  }

  // Calcular balances
  const calculateBalances = (): PersonBalance[] => {
    const activeAttendees = attendees.filter(a => !a.exclude_from_split)
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
    const perPerson = activeAttendees.length > 0 ? totalExpenses / activeAttendees.length : 0

    return activeAttendees.map(attendee => {
      const paid = expenses
        .filter(e => e.attendee_id === attendee.id)
        .reduce((sum, e) => sum + Number(e.amount), 0)

      const owes = perPerson
      const balance = paid - owes

      // Calculate payments made/received
      const paidToOthers = payments
        .filter(p => p.from_attendee_id === attendee.id && p.status === 'completed')
        .reduce((sum, p) => sum + Number(p.amount), 0)

      const receivedFromOthers = payments
        .filter(p => p.to_attendee_id === attendee.id && p.status === 'completed')
        .reduce((sum, p) => sum + Number(p.amount), 0)

      // Net balance considers transfers: if you owed $900 and paid $900, netBalance = 0
      const netBalance = balance + paidToOthers - receivedFromOthers

      return {
        attendee,
        paid,
        owes,
        balance,
        paidToOthers,
        receivedFromOthers,
        netBalance,
        bankInfo: bankInfoMap[attendee.id] || null
      }
    })
  }

  const balances = calculateBalances()
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const activeCount = attendees.filter(a => !a.exclude_from_split).length
  const perPerson = activeCount > 0 ? totalExpenses / activeCount : 0

  const copyToClipboard = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldId)
      setTimeout(() => setCopiedField(null), 2000)
      toast.success('Copiado al portapapeles')
    } catch {
      toast.error('No se pudo copiar')
    }
  }

  const handleOpenAddBankModal = (attendee: Attendee) => {
    setAddBankAttendee(attendee)
    setNewBankInfo({
      holder_name: attendee.name,
      bank_name: '',
      clabe: '',
      account_number: '',
    })
    setShowAddBankModal(true)
  }

  const handleSaveNewBankInfo = async () => {
    if (!addBankAttendee || !newBankInfo.holder_name || !newBankInfo.bank_name || !newBankInfo.clabe) {
      toast.error('Por favor completa los campos requeridos')
      return
    }

    setIsSavingBank(true)
    try {
      const res = await fetch('/api/bank-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendeeId: addBankAttendee.id,
          ...newBankInfo,
        }),
      })

      if (!res.ok) throw new Error('Error al guardar')

      const savedBankInfo = await res.json()

      // Update local state
      setBankInfoMap(prev => ({
        ...prev,
        [addBankAttendee.id]: savedBankInfo
      }))

      toast.success('Datos bancarios guardados')
      setShowAddBankModal(false)
      setAddBankAttendee(null)
    } catch {
      toast.error('Error al guardar datos bancarios')
    } finally {
      setIsSavingBank(false)
    }
  }

  const sendWhatsApp = (creditorName: string, amount: number, bankInfo?: BankInfo | null) => {
    let message = `Hola! Te transferí ${formatCurrency(amount)} para la carnita 🥩`
    if (bankInfo) {
      message += `\n\nDatos bancarios:\n• ${bankInfo.bank_name}\n• CLABE: ${bankInfo.clabe}`
    }
    message += '\n\n¿Me confirmas cuando lo recibas? 🙏'

    const url = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  const markAsPaid = async (fromAttendeeId: string, toAttendeeId: string, amount: number) => {
    const transferId = `${fromAttendeeId}-${toAttendeeId}`
    setSavingPayment(transferId)

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          fromAttendeeId,
          toAttendeeId,
          amount
        })
      })

      if (!res.ok) throw new Error()

      const newPayment = await res.json()
      setPayments(prev => [...prev.filter(p =>
        !(p.from_attendee_id === fromAttendeeId && p.to_attendee_id === toAttendeeId)
      ), newPayment])

      toast.success('¡Pago registrado!')
    } catch {
      toast.error('Error al guardar el pago')
    } finally {
      setSavingPayment(null)
    }
  }

  const undoPayment = async (fromAttendeeId: string, toAttendeeId: string) => {
    const paymentId = getPaymentId(fromAttendeeId, toAttendeeId)
    if (!paymentId) return

    const transferId = `${fromAttendeeId}-${toAttendeeId}`
    setSavingPayment(transferId)

    try {
      const res = await fetch(`/api/payments?id=${paymentId}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error()

      setPayments(prev => prev.filter(p => p.id !== paymentId))
      toast.success('Pago desmarcado')
    } catch {
      toast.error('Error al desmarcar el pago')
    } finally {
      setSavingPayment(null)
    }
  }

  // Toggle exclusion from summary
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
          ? 'Incluido en gastos'
          : 'Excluido de los gastos'
      )
    } catch {
      toast.error('Error al actualizar asistente')
    }
  }

  // Group transfers by debtor - proper settlement algorithm
  const getGroupedTransfers = () => {
    // Create mutable copies of balances
    const debtorBalances = balances
      .filter(b => b.balance < 0)
      .map(b => ({ ...b, remaining: Math.abs(b.balance) }))

    const creditorBalances = balances
      .filter(b => b.balance > 0)
      .map(b => ({ ...b, remaining: b.balance }))

    // Calculate transfers for each debtor
    return debtorBalances.map(debtor => {
      const transfers: Array<{
        creditor: PersonBalance
        amount: number
        isPaid: boolean
        transferId: string
      }> = []

      let debtRemaining = debtor.remaining

      for (const creditor of creditorBalances) {
        if (debtRemaining <= 0 || creditor.remaining <= 0) continue

        const transferAmount = Math.min(debtRemaining, creditor.remaining)

        if (transferAmount > 0.01) { // Avoid tiny amounts due to floating point
          transfers.push({
            creditor,
            amount: transferAmount,
            isPaid: isTransferPaid(debtor.attendee.id, creditor.attendee.id),
            transferId: `${debtor.attendee.id}-${creditor.attendee.id}`
          })

          debtRemaining -= transferAmount
          creditor.remaining -= transferAmount
        }
      }

      return {
        debtor,
        transfers
      }
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-zinc-200 dark:bg-zinc-700 rounded-full animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                      <div className="h-3 w-32 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="h-6 w-24 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Pagos
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          División de gastos entre {activeCount} personas
        </p>
      </div>

      {/* Totales - Visual Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-800/30 shadow-sm overflow-hidden">
          <CardContent className="p-5">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-1">
                <DollarSign className="h-4 w-4" />
                <p className="text-sm font-medium tracking-wide">Gastado</p>
              </div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30 shadow-sm overflow-hidden">
          <CardContent className="p-5">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                <Users className="h-4 w-4" />
                <p className="text-sm font-medium tracking-wide">Por persona</p>
              </div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {formatCurrency(perPerson)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-800/30 shadow-sm overflow-hidden">
          <CardContent className="p-5">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                <CreditCard className="h-4 w-4" />
                <p className="text-sm font-medium tracking-wide">Pagado</p>
              </div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {formatCurrency(payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + Number(p.amount), 0))}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Balances por persona */}
      <Card className="mb-6 overflow-hidden">
        <CardHeader className="p-4 pb-2 border-b border-zinc-50 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800/20">
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-green-500" />
            Balance por persona
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {balances.length === 0 ? (
            <p className="text-center text-zinc-500 dark:text-zinc-400 py-4">
              Agrega asistentes para ver la división
            </p>
          ) : (
            balances.map((b) => (
              <div key={b.attendee.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {b.attendee.name}
                      </p>
                      <Badge className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none">
                        <UserCheck className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">Incluido en gastos</span>
                        <span className="sm:hidden">Incluido</span>
                      </Badge>
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Pagó: {formatCurrency(b.paid)}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      {/* Show original balance based on expenses */}
                      {b.balance > 0 ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Le deben {formatCurrency(b.balance - b.receivedFromOthers)}
                        </Badge>
                      ) : b.balance < 0 ? (
                        // For debtors: show if they've paid
                        b.netBalance >= -0.01 ? (
                          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            ✓ Saldado
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            Debe {formatCurrency(Math.abs(b.netBalance))}
                          </Badge>
                        )
                      ) : (
                        <Badge variant="secondary">A mano</Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => handleToggleExclusion(b.attendee)}
                      title="Excluir de los gastos"
                    >
                      <UserMinus className="h-4 w-4 mr-1.5" />
                      <span className="text-sm">Excluir</span>
                    </Button>
                  </div>
                </div>
                <Separator className="mt-4" />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Personas excluidas - Rediseñado como lista */}
      {attendees.filter(a => a.exclude_from_split).length > 0 && (
        <Card className="mb-6 border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 overflow-hidden">
          <CardHeader className="p-4 pb-2 border-b border-zinc-50 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800/20">
            <CardTitle className="text-base flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
              <UserX className="h-5 w-5" />
              Excluidos de los gastos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {attendees
              .filter(a => a.exclude_from_split)
              .map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-3 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm"
                >
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {a.name}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-sm gap-1.5 hover:bg-green-50 hover:text-green-600 hover:border-green-200 dark:hover:bg-green-900/20"
                    onClick={() => handleToggleExclusion(a)}
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Incluir
                  </Button>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Transferencias sugeridas - Agrupadas por deudor */}
      {balances.some(b => b.balance !== 0) && (
        <Card className="mt-6 overflow-hidden">
          <CardHeader className="p-4 pb-2 border-b border-zinc-50 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800/20">
            <CardTitle className="text-lg">Transferencias sugeridas</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-6">
            {getGroupedTransfers().map(({ debtor, transfers }) => (
              <div key={debtor.attendee.id} className="space-y-3">
                {/* Debtor Header */}
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-700">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {debtor.attendee.name}
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                    Debe: {formatCurrency(Math.abs(debtor.balance))}
                  </p>
                </div>

                {/* Transfers for this debtor */}
                {transfers.map(({ creditor, amount, isPaid, transferId }) => {
                  const isSaving = savingPayment === transferId

                  return (
                    <div
                      key={transferId}
                      className={`p-4 rounded-lg border ${isPaid
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                        }`}
                    >
                      {/* Header: Name + Amount on same line */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500">→</span>
                          <span className="font-medium">{creditor.attendee.name}</span>
                        </div>
                        <Badge className={isPaid ? 'bg-green-500' : 'bg-blue-500'}>
                          {formatCurrency(amount)}
                        </Badge>
                      </div>

                      {/* Actions - Stack on mobile */}
                      <div className="flex flex-col md:flex-row gap-2">
                        {!isPaid && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full md:flex-1"
                              onClick={() => sendWhatsApp(creditor.attendee.name, amount, creditor.bankInfo)}
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              WhatsApp
                            </Button>
                            {creditor.bankInfo && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full md:flex-1"
                                onClick={() => {
                                  setSelectedBankInfo({
                                    name: creditor.attendee.name,
                                    info: creditor.bankInfo!
                                  })
                                  setShowBankInfoModal(true)
                                }}
                              >
                                <CreditCard className="h-4 w-4 mr-2" />
                                <span className="md:hidden">Ver datos bancarios</span>
                                <span className="hidden md:inline">Ver datos</span>
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full md:flex-1 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 font-bold text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-all"
                              onClick={() => markAsPaid(debtor.attendee.id, creditor.attendee.id, amount)}
                              disabled={isSaving}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              {isSaving ? 'Guardando...' : 'Marcar pagado'}
                            </Button>
                          </>
                        )}
                        {isPaid && (
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                              <CheckCircle2 className="h-5 w-5" />
                              <span className="font-medium">Pagado</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => undoPayment(debtor.attendee.id, creditor.attendee.id)}
                              disabled={isSaving}
                              className="text-zinc-500 hover:text-zinc-700"
                            >
                              <Undo2 className="h-4 w-4 mr-1" />
                              Deshacer
                            </Button>
                          </div>
                        )}
                      </div>

                      {!creditor.bankInfo && !isPaid && (
                        <div className="mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenAddBankModal(creditor.attendee)}
                            className="w-full"
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Agregar datos bancarios
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Bank Info Modal */}
      <Dialog open={showBankInfoModal} onOpenChange={setShowBankInfoModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Datos bancarios de {selectedBankInfo?.name}</DialogTitle>
          </DialogHeader>
          {selectedBankInfo && (
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <div>
                    <p className="text-sm text-zinc-500">Titular</p>
                    <p className="font-medium">{selectedBankInfo.info.holder_name}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(selectedBankInfo.info.holder_name, 'modal-holder')}
                  >
                    {copiedField === 'modal-holder' ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <div>
                    <p className="text-sm text-zinc-500">Banco</p>
                    <p className="font-medium">{selectedBankInfo.info.bank_name}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(selectedBankInfo.info.bank_name, 'modal-bank')}
                  >
                    {copiedField === 'modal-bank' ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <div>
                    <p className="text-sm text-zinc-500">CLABE</p>
                    <p className="font-medium font-mono">{selectedBankInfo.info.clabe}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(selectedBankInfo.info.clabe, 'modal-clabe')}
                  >
                    {copiedField === 'modal-clabe' ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {selectedBankInfo.info.account_number && (
                  <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                    <div>
                      <p className="text-sm text-zinc-500">Número de cuenta</p>
                      <p className="font-medium font-mono">{selectedBankInfo.info.account_number}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(selectedBankInfo.info.account_number!, 'modal-account')}
                    >
                      {copiedField === 'modal-account' ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Bank Info Modal */}
      <Dialog open={showAddBankModal} onOpenChange={setShowAddBankModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Datos bancarios de {addBankAttendee?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="holder_name">Nombre del titular *</Label>
              <Input
                id="holder_name"
                value={newBankInfo.holder_name}
                onChange={(e) => setNewBankInfo({ ...newBankInfo, holder_name: e.target.value })}
                placeholder="Nombre completo"
                disabled={isSavingBank}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_name">Banco *</Label>
              <Input
                id="bank_name"
                value={newBankInfo.bank_name}
                onChange={(e) => setNewBankInfo({ ...newBankInfo, bank_name: e.target.value })}
                placeholder="Ej: BBVA, Banorte, etc."
                disabled={isSavingBank}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clabe">CLABE interbancaria *</Label>
              <Input
                id="clabe"
                value={newBankInfo.clabe}
                onChange={(e) => setNewBankInfo({ ...newBankInfo, clabe: e.target.value })}
                placeholder="18 dígitos"
                maxLength={18}
                disabled={isSavingBank}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account_number">Número de cuenta (opcional)</Label>
              <Input
                id="account_number"
                value={newBankInfo.account_number}
                onChange={(e) => setNewBankInfo({ ...newBankInfo, account_number: e.target.value })}
                placeholder="Número de cuenta"
                disabled={isSavingBank}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddBankModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="outline"
              onClick={handleSaveNewBankInfo}
              disabled={isSavingBank}
              className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 font-bold text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-all"
            >
              {isSavingBank ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
