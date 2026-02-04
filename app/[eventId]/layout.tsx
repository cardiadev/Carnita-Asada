import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/layout/bottom-nav'

interface EventLayoutProps {
  children: React.ReactNode
  params: Promise<{ eventId: string }>
}

export default async function EventLayout({ children, params }: EventLayoutProps) {
  const { eventId } = await params
  const supabase = await createClient()

  // Verificar que el evento existe
  const { data: event } = await supabase
    .from('events')
    .select('id, nano_id')
    .eq('nano_id', eventId)
    .single()

  if (!event) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 pb-20 md:pb-0">
      {children}
      <BottomNav eventId={eventId} />
    </div>
  )
}
