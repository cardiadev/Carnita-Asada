import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Countdown } from '@/components/event/countdown'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils/currency'

interface EventPageProps {
  params: Promise<{ eventId: string }>
}

interface EventWithAttendees {
  id: string
  nano_id: string
  title: string
  event_date: string
  people_count: number
  created_at: string
  updated_at: string
  attendees: Array<{ id: string; name: string; exclude_from_split: boolean }>
}

interface PersonBalance {
  name: string
  attendeeId: string
  paid: number
  balance: number
}

export default async function EventPage({ params }: EventPageProps) {
  const { eventId } = await params
  const supabase = await createClient()

  // Obtener evento con asistentes
  const { data: eventData, error } = await supabase
    .from('events')
    .select(`
      *,
      attendees (*)
    `)
    .eq('nano_id', eventId)
    .single()

  if (error || !eventData) {
    notFound()
  }

  const event = eventData as unknown as EventWithAttendees

  // Obtener gastos con asistente
  const { data: expensesData } = await supabase
    .from('expenses')
    .select('amount, attendee_id')
    .eq('event_id', event.id)

  const expenses = expensesData as Array<{ amount: number; attendee_id: string | null }> | null
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
  const attendeesCount = event.attendees?.length || 0
  const activeAttendees = event.attendees?.filter((a) => !a.exclude_from_split) || []
  const activeCount = activeAttendees.length
  const perPerson = activeCount > 0 ? totalExpenses / activeCount : 0

  // Calcular quién falta por pagar
  const balances: PersonBalance[] = activeAttendees.map(attendee => {
    const paid = expenses
      ?.filter(e => e.attendee_id === attendee.id)
      .reduce((sum, e) => sum + Number(e.amount), 0) || 0

    return {
      name: attendee.name,
      attendeeId: attendee.id,
      paid,
      balance: paid - perPerson
    }
  })

  const pendingPayments = balances.filter(b => b.balance < 0)
  const completedPayments = balances.filter(b => b.balance >= 0)

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          {event.title}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {attendeesCount} {attendeesCount === 1 ? 'asistente' : 'asistentes'}
        </p>
      </div>

      {/* Countdown */}
      <div className="mb-6">
        <Countdown targetDate={event.event_date} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Total gastado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {formatCurrency(totalExpenses)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Por persona
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {formatCurrency(perPerson)}
            </p>
            {activeCount !== attendeesCount && (
              <p className="text-xs text-zinc-500 mt-1">
                Entre {activeCount} personas
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Progress */}
      {balances.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              Estado de pagos
              <Badge variant="outline">
                {completedPayments.length}/{balances.length} al día
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${(completedPayments.length / balances.length) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Payments */}
      {pendingPayments.length > 0 && (
        <Card className="mb-6 border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-lg text-red-700 dark:text-red-400">
              ¿Quién falta por pagar?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingPayments.map((person) => (
              <div
                key={person.attendeeId}
                className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400 font-medium">
                    {person.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {person.name}
                  </span>
                </div>
                <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  Debe {formatCurrency(Math.abs(person.balance))}
                </Badge>
              </div>
            ))}
            <Link
              href={`/${eventId}/summary`}
              className="block text-center text-sm text-orange-600 hover:underline mt-2"
            >
              Ver pagos y transferencias →
            </Link>
          </CardContent>
        </Card>
      )}

      {/* All Caught Up */}
      {pendingPayments.length === 0 && balances.length > 0 && (
        <Card className="mb-6 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
          <CardContent className="py-6 text-center">
            <div className="text-4xl mb-2">🎉</div>
            <h3 className="font-bold text-green-700 dark:text-green-400">
              ¡Todos al día!
            </h3>
            <p className="text-sm text-green-600 dark:text-green-500">
              No hay pagos pendientes
            </p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {balances.length === 0 && (
        <Card className="mb-6">
          <CardContent className="py-8 text-center text-zinc-500 dark:text-zinc-400">
            <p>Agrega asistentes y registra gastos para ver el estado de pagos</p>
            <div className="flex justify-center gap-4 mt-4">
              <Link
                href={`/${eventId}/attendees`}
                className="text-orange-600 hover:underline"
              >
                Agregar asistentes
              </Link>
              <Link
                href={`/${eventId}/expenses`}
                className="text-orange-600 hover:underline"
              >
                Registrar gastos
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

