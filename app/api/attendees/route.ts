import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAttendeeSchema } from '@/lib/validations/attendee'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId es requerido' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Obtener el ID real del evento desde el nano_id
    const { data: event } = await supabase
      .from('events')
      .select('id')
      .eq('nano_id', eventId)
      .single()

    if (!event) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      )
    }

    const { data: attendees, error } = await supabase
      .from('attendees')
      .select('*')
      .eq('event_id', event.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching attendees:', error)
      return NextResponse.json(
        { error: 'Error al obtener asistentes' },
        { status: 500 }
      )
    }

    return NextResponse.json(attendees)
  } catch (error) {
    console.error('Error in GET /api/attendees:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const result = createAttendeeSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { eventId, name } = result.data
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('attendees')
      .insert({
        event_id: eventId,
        name,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating attendee:', error)
      return NextResponse.json(
        { error: 'Error al agregar asistente' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in POST /api/attendees:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
