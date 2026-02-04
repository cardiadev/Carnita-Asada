import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { EventSidebar } from '@/components/event-sidebar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Separator } from '@/components/ui/separator'

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
    <SidebarProvider>
      <EventSidebar eventId={eventId} eventTitle={event.title} />
      <SidebarInset>
        {/* Header con trigger para sidebar en desktop */}
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-4 md:px-6">
          <SidebarTrigger className="-ml-1 hidden md:flex" />
          <Separator orientation="vertical" className="mr-2 h-4 hidden md:block" />
          <h1 className="text-sm font-medium truncate md:hidden">{event.title}</h1>
        </header>

        {/* Contenido principal */}
        <div className="flex-1 pb-20 md:pb-0">
          {children}
        </div>

        {/* Bottom nav solo para mobile */}
        <BottomNav eventId={eventId} />
      </SidebarInset>
    </SidebarProvider>
  )
}
