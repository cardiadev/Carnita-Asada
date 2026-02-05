'use client'

import { useState, useEffect, use } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Copy, Check, MessageCircle, CheckCircle2, Undo2 } from 'lucide-react'
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

      return {
        attendee,
        paid,
        owes,
        balance,
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <div className="h-16 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
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

      {/* Totales */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
          <CardContent className="py-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Total gastado</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {formatCurrency(totalExpenses)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Por persona</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {formatCurrency(perPerson)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Balances por persona */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Balance por persona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {balances.length === 0 ? (
            <p className="text-center text-zinc-500 dark:text-zinc-400 py-4">
              Agrega asistentes para ver la división
            </p>
          ) : (
            balances.map((b) => (
              <div key={b.attendee.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-medium">
                      {b.attendee.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {b.attendee.name}
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Pagó: {formatCurrency(b.paid)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    {b.balance > 0 ? (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Le deben {formatCurrency(b.balance)}
                      </Badge>
                    ) : b.balance < 0 ? (
                      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        Debe {formatCurrency(Math.abs(b.balance))}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">A mano</Badge>
                    )}
                  </div>
                </div>
                <Separator className="mt-4" />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Personas excluidas */}
      {attendees.filter(a => a.exclude_from_split).length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Excluidos de la división</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {attendees
                .filter(a => a.exclude_from_split)
                .map((a) => (
                  <Badge key={a.id} variant="outline">
                    {a.name}
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transferencias sugeridas */}
      {balances.some(b => b.balance !== 0) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Transferencias sugeridas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {balances
              .filter(b => b.balance < 0)
              .map((debtor) => {
                const creditors = balances.filter(b => b.balance > 0)
                return creditors.map((creditor) => {
                  const transferId = `${debtor.attendee.id}-${creditor.attendee.id}`
                  const isPaid = isTransferPaid(debtor.attendee.id, creditor.attendee.id)
                  const isSaving = savingPayment === transferId
                  const transferAmount = Math.min(Math.abs(debtor.balance), creditor.balance)

                  return (
                    <div
                      key={transferId}
                      className={`p-4 rounded-lg border ${isPaid
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{debtor.attendee.name}</span>
                          <span className="text-zinc-500">→</span>
                          <span className="font-medium">{creditor.attendee.name}</span>
                        </div>
                        <Badge className={isPaid ? 'bg-green-500' : 'bg-blue-500'}>
                          {formatCurrency(transferAmount)}
                        </Badge>
                      </div>

                      {/* Bank Info */}
                      {creditor.bankInfo && (
                        <div className="mb-3 p-3 bg-white dark:bg-zinc-800 rounded-lg space-y-2">
                          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Datos bancarios de {creditor.attendee.name}:
                          </p>
                          <div className="grid gap-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-zinc-500">Titular:</span>
                              <div className="flex items-center gap-2">
                                <span>{creditor.bankInfo.holder_name}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => copyToClipboard(creditor.bankInfo!.holder_name, `titular-${transferId}`)}
                                >
                                  {copiedField === `titular-${transferId}` ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-zinc-500">Banco:</span>
                              <div className="flex items-center gap-2">
                                <span>{creditor.bankInfo.bank_name}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => copyToClipboard(creditor.bankInfo!.bank_name, `bank-${transferId}`)}
                                >
                                  {copiedField === `bank-${transferId}` ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-zinc-500">CLABE:</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono">{creditor.bankInfo.clabe}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => copyToClipboard(creditor.bankInfo!.clabe, `clabe-${transferId}`)}
                                >
                                  {copiedField === `clabe-${transferId}` ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            {creditor.bankInfo.account_number && (
                              <div className="flex items-center justify-between">
                                <span className="text-zinc-500">Cuenta:</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono">{creditor.bankInfo.account_number}</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => copyToClipboard(creditor.bankInfo!.account_number!, `account-${transferId}`)}
                                  >
                                    {copiedField === `account-${transferId}` ? (
                                      <Check className="h-3 w-3 text-green-500" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        {!isPaid && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => sendWhatsApp(creditor.attendee.name, transferAmount, creditor.bankInfo)}
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              WhatsApp
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              onClick={() => markAsPaid(debtor.attendee.id, creditor.attendee.id, transferAmount)}
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
                        <p className="text-xs text-zinc-500 mt-2">
                          💡 {creditor.attendee.name} puede agregar sus datos bancarios en Asistentes
                        </p>
                      )}
                    </div>
                  )
                })
              })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
