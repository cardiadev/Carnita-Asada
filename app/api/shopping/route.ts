import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createShoppingItemSchema } from '@/lib/validations/shopping'

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

    // Obtener el ID real del evento
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

    const { data: items, error } = await supabase
      .from('shopping_items')
      .select(`
        *,
        category:categories (*)
      `)
      .eq('event_id', event.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching shopping items:', error)
      return NextResponse.json(
        { error: 'Error al obtener lista de compras' },
        { status: 500 }
      )
    }

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error in GET /api/shopping:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const result = createShoppingItemSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { eventId, categoryId, name, quantity, unit } = result.data
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('shopping_items')
      .insert({
        event_id: eventId,
        category_id: categoryId || null,
        name,
        quantity,
        unit,
      })
      .select(`
        *,
        category:categories (*)
      `)
      .single()

    if (error) {
      console.error('Error creating shopping item:', error)
      return NextResponse.json(
        { error: 'Error al agregar item' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in POST /api/shopping:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
