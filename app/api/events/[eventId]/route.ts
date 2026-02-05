import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateEventSchema } from '@/lib/validations/event'

interface RouteParams {
  params: Promise<{ eventId: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { eventId } = await params
    const supabase = await createClient()

    // Obtener evento por nano_id
    const { data: event, error } = await supabase
      .from('events')
      .select(`
        *,
        attendees (*)
      `)
      .eq('nano_id', eventId)
      .single()

    if (error || !event) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      )
    }

    // Obtener total de gastos
    const { data: expensesData } = await supabase
      .from('expenses')
      .select('amount')
      .eq('event_id', event.id)

    const totalExpenses = expensesData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0

    return NextResponse.json({
      id: event.id,
      nanoId: event.nano_id,
      title: event.title,
      eventDate: event.event_date,
      location: event.location,
      cancelledAt: event.cancelled_at,
      peopleCount: event.people_count,
      attendees: event.attendees,
      totalExpenses,
      createdAt: event.created_at,
      updatedAt: event.updated_at,
    })
  } catch (error) {
    console.error('Error in GET /api/events/[eventId]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { eventId } = await params
    const body = await request.json()

    const result = updateEventSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Primero obtener el ID real del evento
    const { data: existingEvent } = await supabase
      .from('events')
      .select('id')
      .eq('nano_id', eventId)
      .single()

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}

    // Handle cancel request (soft delete)
    if (body.cancel === true) {
      updateData.cancelled_at = new Date().toISOString()
    } else {
      if (result.data.title) updateData.title = result.data.title
      if (result.data.eventDate) updateData.event_date = result.data.eventDate
      if (result.data.peopleCount !== undefined) updateData.people_count = result.data.peopleCount
      if (result.data.location !== undefined) updateData.location = result.data.location
    }

    const { data, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', existingEvent.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating event:', error)
      return NextResponse.json(
        { error: 'Error al actualizar el evento' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      id: data.id,
      nanoId: data.nano_id,
      title: data.title,
      eventDate: data.event_date,
      location: data.location,
      cancelledAt: data.cancelled_at,
      peopleCount: data.people_count,
    })
  } catch (error) {
    console.error('Error in PATCH /api/events/[eventId]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { eventId } = await params
    const supabase = await createClient()

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('nano_id', eventId)

    if (error) {
      console.error('Error deleting event:', error)
      return NextResponse.json(
        { error: 'Error al eliminar el evento' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/events/[eventId]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
