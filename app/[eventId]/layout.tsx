import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EventLayoutClient } from '@/components/event-layout-client'

interface EventLayoutProps {
  children: React.ReactNode
  params: Promise<{ eventId: string }>
}

export default async function EventLayout({ children, params }: EventLayoutProps) {
  const { eventId } = await params
  const supabase = await createClient()

  // Verificar que el evento existe y obtener título
  const { data: event } = await supabase
    .from('events')
    .select('id, nano_id, title')
    .eq('nano_id', eventId)
    .single()

  if (!event) {
    notFound()
  }

  return (
    <EventLayoutClient eventId={eventId} eventTitle={event.title}>
      {children}
    </EventLayoutClient>
  )
}
