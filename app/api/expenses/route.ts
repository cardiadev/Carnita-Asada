import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createExpenseSchema } from '@/lib/validations/expense'

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

    const { data: expenses, error } = await supabase
      .from('expenses')
      .select(`
        *,
        attendee:attendees (*)
      `)
      .eq('event_id', event.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching expenses:', error)
      return NextResponse.json(
        { error: 'Error al obtener gastos' },
        { status: 500 }
      )
    }

    return NextResponse.json(expenses)
  } catch (error) {
    console.error('Error in GET /api/expenses:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const result = createExpenseSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { eventId, attendeeId, description, amount, receiptUrl, excludedAttendees } = result.data
    const supabase = await createClient()

    // Crear el gasto
    const { data: expense, error } = await supabase
      .from('expenses')
      .insert({
        event_id: eventId,
        attendee_id: attendeeId || null,
        description,
        amount,
        receipt_url: receiptUrl || null,
      })
      .select(`
        *,
        attendee:attendees (*)
      `)
      .single()

    if (error) {
      console.error('Error creating expense:', error)
      return NextResponse.json(
        { error: 'Error al crear gasto' },
        { status: 500 }
      )
    }

    // Agregar exclusiones si hay
    if (excludedAttendees?.length) {
      const exclusions = excludedAttendees.map(attendeeId => ({
        expense_id: expense.id,
        attendee_id: attendeeId,
      }))

      await supabase.from('expense_exclusions').insert(exclusions)
    }

    return NextResponse.json(expense)
  } catch (error) {
    console.error('Error in POST /api/expenses:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
