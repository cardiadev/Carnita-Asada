import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Countdown } from '@/components/event/countdown'
import { ShareButton } from '@/components/event/share-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

  // Obtener total de gastos
  const { data: expensesData } = await supabase
    .from('expenses')
    .select('amount')
    .eq('event_id', event.id)

  const expenses = expensesData as Array<{ amount: number }> | null
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
  const attendeesCount = event.attendees?.length || 0
  const activeAttendees = event.attendees?.filter((a) => !a.exclude_from_split).length || 0
  const perPerson = activeAttendees > 0 ? totalExpenses / activeAttendees : 0

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const eventUrl = `${appUrl}/${eventId}`

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {event.title}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {attendeesCount} {attendeesCount === 1 ? 'asistente' : 'asistentes'}
          </p>
        </div>
        <ShareButton eventUrl={eventUrl} eventTitle={event.title} />
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
            {activeAttendees !== attendeesCount && (
              <p className="text-xs text-zinc-500 mt-1">
                Entre {activeAttendees} personas
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Acciones rápidas
        </h2>

        <div className="grid gap-3">
          <QuickActionCard
            href={`/${eventId}/attendees`}
            title="Agregar asistentes"
            description="Añade a las personas que irán a la carnita"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <line x1="19" x2="19" y1="8" y2="14"/>
                <line x1="22" x2="16" y1="11" y2="11"/>
              </svg>
            }
          />

          <QuickActionCard
            href={`/${eventId}/shopping`}
            title="Lista de compras"
            description="Organiza qué necesitas comprar para el evento"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                <path d="M3 6h18"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
            }
          />

          <QuickActionCard
            href={`/${eventId}/expenses`}
            title="Registrar gastos"
            description="Añade los gastos y sube los comprobantes"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="14" x="2" y="5" rx="2"/>
                <line x1="2" x2="22" y1="10" y2="10"/>
              </svg>
            }
          />

          <QuickActionCard
            href={`/${eventId}/summary`}
            title="Ver resumen"
            description="Revisa la división de gastos entre todos"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18"/>
                <path d="m19 9-5 5-4-4-3 3"/>
              </svg>
            }
          />
        </div>
      </div>
    </div>
  )
}

function QuickActionCard({
  href,
  title,
  description,
  icon,
}: {
  href: string
  title: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <a href={href}>
      <Card className="hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
        <CardContent className="flex items-center gap-4 py-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
            {icon}
          </div>
          <div>
            <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
              {title}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {description}
            </p>
          </div>
        </CardContent>
      </Card>
    </a>
  )
}
