import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Countdown } from '@/components/event/countdown'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils/currency'
import { DollarSign, Users, MessageCircle, ArrowRight, MapPin, Megaphone, Beef, Lightbulb, ExternalLink, PieChart, Heart } from 'lucide-react'

interface EventPageProps {
  params: Promise<{ eventId: string }>
}

interface EventWithAttendees {
  id: string
  nano_id: string
  title: string
  event_date: string
  location: string | null
  description: string | null
  maps_url: string | null
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

// Sugerencias de cortes de carne y cantidades
const MEAT_SUGGESTIONS = [
  { name: 'Arrachera', quantity: '150-200g', icon: '🥩' },
  { name: 'Costilla', quantity: '200-250g', icon: '🍖' },
  { name: 'Chorizo', quantity: '100g', icon: '🥩' },
  { name: 'Pollo', quantity: '150g', icon: '🍗' },
  { name: 'Bistec', quantity: '150g', icon: '🥩' },
]

const RECOMMENDED_ITEMS = [
  'Carbón (1kg por cada 4 personas)',
  'Tortillas (100g por persona)',
  'Limones (2 por persona)',
  'Salsa y guacamole',
  'Cebollas y chiles para asar',
  'Servilletas y platos desechables',
  'Hielo y bebidas',
]

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
    <div className="container mx-auto px-4 pt-6 pb-20 max-w-2xl">
      {/* Countdown with Title & Attendees */}
      <div className="mb-4">
        <Countdown
          targetDate={event.event_date}
          title={event.title}
          attendeesCount={attendeesCount}
          location={event.location}
          mapsUrl={event.maps_url}
          cancelled={!!event.cancelled_at}
        />
      </div>

      {/* Location with Maps Link - MOVED TO COUNTDOWN */}


      {/* Stats - More Visual (CRITICAL: PRIORITY AT TOP) */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-800/30 shadow-xl shadow-orange-100/50 dark:shadow-none border-2">
          <CardContent className="p-5">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 mb-1">
                <DollarSign className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <p className="text-base font-bold tracking-wide">Gastado</p>
              </div>
              <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100 leading-none">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30 shadow-xl shadow-blue-100/50 dark:shadow-none border-2">
          <CardContent className="p-5">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 mb-1">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <p className="text-base font-bold tracking-wide">Por persona</p>
              </div>
              <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100 leading-none">
                {formatCurrency(perPerson)}
              </p>
              {activeCount !== attendeesCount && (
                <p className="text-xs text-zinc-500 mt-1 font-medium">
                  Entre {activeCount}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Progress */}
      {balances.length > 0 && (
        <Card className="mb-4 border-zinc-200 dark:border-zinc-700">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base flex items-center justify-between font-semibold text-zinc-700 dark:text-zinc-300">
              <div className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-blue-500" />
                Estado de pagos
              </div>
              <Badge variant="secondary" className="font-normal">
                {completedPayments.length}/{balances.length} al día
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${(completedPayments.length / balances.length) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Announcements / Description */}
      {event.description && (
        <Card className="mb-4 bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Megaphone className="h-5 w-5" />
              Avisos
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-line text-sm">
              {event.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pending Payments */}
      {pendingPayments.length > 0 && (
        <Card className="mb-4 border-zinc-200 dark:border-zinc-700">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base flex items-center gap-2 font-semibold text-zinc-700 dark:text-zinc-300">
              <Users className="h-5 w-5 text-red-500" />
              ¿Quién falta por pagar?
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {pendingPayments.map((person) => (
              <div
                key={person.attendeeId}
                className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-400 font-medium">
                    {person.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {person.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-none font-medium">
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
            <Button
              asChild
              variant="outline"
              className="w-full mt-4 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 font-bold text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-all h-11"
            >
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
        <Card className="mb-4 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
          <CardContent className="py-4 text-center">
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
        <Card className="mb-4 border-zinc-200 dark:border-zinc-700">
          <CardContent className="py-6 text-center text-zinc-500 dark:text-zinc-400">
            <p className="text-zinc-600 dark:text-zinc-400 mb-6 px-4">Agrega asistentes y registra gastos para comenzar</p>
            <div className="flex flex-row justify-center gap-3 px-4">
              <Button asChild variant="outline" className="flex-1 max-w-[160px] h-11 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 font-bold text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-all">
                <Link href={`/${eventId}/expenses`}>
                  Registrar gastos
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1 max-w-[160px] h-11 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 font-bold text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all">
                <Link href={`/${eventId}/attendees`}>
                  Agregar asistentes
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggestions Section */}
      <Card className="border-zinc-200 dark:border-zinc-700 overflow-hidden">
        <CardHeader className="p-4 pb-2 border-b border-zinc-50 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800/20">
          <CardTitle className="text-base flex items-center justify-between font-semibold text-zinc-700 dark:text-zinc-300">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Sugerencias para tu Carnita Asada
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs font-normal hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-950/30">
              <Link href={`/${eventId}/suggestions`}>
                Ver más <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Meat Cuts */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-3 flex items-center gap-2">
              <Beef className="h-4 w-4 text-red-500" />
              Cortes de carne (cantidad por persona)
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {MEAT_SUGGESTIONS.map((meat) => (
                <div
                  key={meat.name}
                  className="flex flex-col items-center gap-1 p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-sm border border-zinc-100 dark:border-zinc-800 shadow-sm transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800 text-center"
                >
                  <span className="text-xl">{meat.icon}</span>
                  <div>
                    <p className="font-bold text-zinc-900 dark:text-zinc-100 leading-tight text-[11px] sm:text-xs">{meat.name}</p>
                    <p className="text-[10px] text-zinc-500 leading-tight mt-0.5">{meat.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Items */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-2 flex items-center gap-2">
              📋 No olvides
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
              {RECOMMENDED_ITEMS.map((item, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
