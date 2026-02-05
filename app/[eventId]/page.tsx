import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Countdown } from '@/components/event/countdown'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils/currency'
import { DollarSign, Users, MessageCircle, ArrowRight } from 'lucide-react'

interface EventPageProps {
  params: Promise<{ eventId: string }>
}

interface EventWithAttendees {
  id: string
  nano_id: string
  title: string
  event_date: string
  location: string | null
  cancelled_at: string | null
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

  // WhatsApp reminder function
  const getWhatsAppUrl = (personName: string) => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://carnita-asada.vercel.app`
    const message = `¡Hola ${personName}! 👋\n\n🔥 No olvides hacer tus pagos de la carnita asada "${event.title}".\n\n👉 ${appUrl}/${eventId}/summary\n\n¡Nos vemos pronto! 🥩`
    return `https://wa.me/?text=${encodeURIComponent(message)}`
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Countdown with Title & Attendees */}
      <div className="mb-6">
        <Countdown
          targetDate={event.event_date}
          title={event.title}
          attendeesCount={attendeesCount}
          location={event.location}
          cancelled={!!event.cancelled_at}
        />
      </div>

      {/* Stats - More Visual */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-orange-500 to-amber-500 text-white border-0 shadow-lg">
          <CardContent className="py-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-white/80">Total gastado</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalExpenses)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white border-0 shadow-lg">
          <CardContent className="py-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-white/80">Por persona</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(perPerson)}
                </p>
                {activeCount !== attendeesCount && (
                  <p className="text-xs text-white/70">
                    Entre {activeCount} personas
                  </p>
                )}
              </div>
            </div>
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
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    Debe {formatCurrency(Math.abs(person.balance))}
                  </Badge>
                  <a
                    href={getWhatsAppUrl(person.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
                    title="Enviar recordatorio por WhatsApp"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
            <Button asChild className="w-full mt-4" variant="default">
              <Link href={`/${eventId}/summary`}>
                Ver pagos y transferencias
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
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
              <Button asChild variant="outline">
                <Link href={`/${eventId}/attendees`}>
                  Agregar asistentes
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/${eventId}/expenses`}>
                  Registrar gastos
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
