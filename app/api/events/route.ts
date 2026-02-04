import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateEventId } from '@/lib/utils/nanoid'
import { createEventSchema } from '@/lib/validations/event'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validar datos de entrada
    const result = createEventSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { title, eventDate } = result.data
    const nanoId = generateEventId()

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('events')
      .insert({
        nano_id: nanoId,
        title,
        event_date: eventDate,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating event:', error)
      return NextResponse.json(
        { error: 'Error al crear el evento' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      id: data.id,
      nanoId: data.nano_id,
      title: data.title,
      eventDate: data.event_date,
      createdAt: data.created_at,
    })
  } catch (error) {
    console.error('Error in POST /api/events:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
