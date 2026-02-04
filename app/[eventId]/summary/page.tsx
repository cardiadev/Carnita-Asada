'use client'

import { useState, useEffect, use } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils/currency'
import type { Expense, Attendee } from '@/types/database'

interface SummaryPageProps {
  params: Promise<{ eventId: string }>
}

type ExpenseWithAttendee = Expense & {
  attendee: Attendee | null
}

interface PersonBalance {
  attendee: Attendee
  paid: number
  owes: number
  balance: number // positive = le deben, negative = debe
}

export default function SummaryPage({ params }: SummaryPageProps) {
  const { eventId } = use(params)
  const [expenses, setExpenses] = useState<ExpenseWithAttendee[]>([])
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener evento con asistentes
        const eventRes = await fetch(`/api/events/${eventId}`)
        const eventData = await eventRes.json()
        if (eventRes.ok) {
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

  // Calcular balances
  const calculateBalances = (): PersonBalance[] => {
    const activeAttendees = attendees.filter(a => !a.exclude_from_split)
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
    const perPerson = activeAttendees.length > 0 ? totalExpenses / activeAttendees.length : 0

    return activeAttendees.map(attendee => {
      // Cuánto pagó esta persona
      const paid = expenses
        .filter(e => e.attendee_id === attendee.id)
        .reduce((sum, e) => sum + Number(e.amount), 0)

      // Cuánto debe (por ahora sin exclusiones por gasto específico)
      const owes = perPerson

      // Balance: positivo = le deben, negativo = debe
      const balance = paid - owes

      return { attendee, paid, owes, balance }
    })
  }

  const balances = calculateBalances()
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const activeCount = attendees.filter(a => !a.exclude_from_split).length
  const perPerson = activeCount > 0 ? totalExpenses / activeCount : 0

  // Generar texto para compartir
  const generateShareText = () => {
    let text = `💰 Resumen de gastos\n\n`
    text += `Total: ${formatCurrency(totalExpenses)}\n`
    text += `Por persona: ${formatCurrency(perPerson)}\n\n`
    text += `📋 Balance por persona:\n`

    balances.forEach(b => {
      const status = b.balance > 0 ? `le deben ${formatCurrency(b.balance)}` :
                     b.balance < 0 ? `debe ${formatCurrency(Math.abs(b.balance))}` :
                     'a mano'
      text += `• ${b.attendee.name}: ${status}\n`
    })

    return text
  }

  const handleShare = async () => {
    const text = generateShareText()

    if (navigator.share) {
      try {
        await navigator.share({ text })
        return
      } catch {
        // fallback
      }
    }

    try {
      await navigator.clipboard.writeText(text)
      toast.success('¡Resumen copiado al portapapeles!')
    } catch {
      toast.error('No se pudo copiar')
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
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Resumen
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            División de gastos entre {activeCount} personas
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={handleShare}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
            <polyline points="16 6 12 2 8 6"/>
            <line x1="12" x2="12" y1="2" y2="15"/>
          </svg>
          Compartir
        </Button>
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
        <Card>
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

      {/* Instrucciones de transferencias */}
      {balances.some(b => b.balance !== 0) && (
        <Card className="mt-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="py-4">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Transferencias sugeridas
            </h3>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              {balances
                .filter(b => b.balance < 0)
                .map((debtor) => {
                  const creditors = balances.filter(b => b.balance > 0)
                  return creditors.map((creditor) => (
                    <p key={`${debtor.attendee.id}-${creditor.attendee.id}`}>
                      {debtor.attendee.name} → {creditor.attendee.name}
                    </p>
                  ))
                })}
              <p className="mt-2 text-xs opacity-75">
                Coordínense para hacer las transferencias correspondientes
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
