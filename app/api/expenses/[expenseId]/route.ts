import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateExpenseSchema } from '@/lib/validations/expense'

interface RouteParams {
  params: Promise<{ expenseId: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { expenseId } = await params
    const supabase = await createClient()

    const { data: expense, error } = await supabase
      .from('expenses')
      .select(`
        *,
        attendee:attendees (*),
        exclusions:expense_exclusions (
          attendee:attendees (*)
        )
      `)
      .eq('id', expenseId)
      .single()

    if (error || !expense) {
      return NextResponse.json(
        { error: 'Gasto no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(expense)
  } catch (error) {
    console.error('Error in GET /api/expenses/[expenseId]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { expenseId } = await params
    const body = await request.json()

    const result = updateExpenseSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const updateData: Record<string, unknown> = {}
    if (result.data.attendeeId !== undefined) updateData.attendee_id = result.data.attendeeId
    if (result.data.description) updateData.description = result.data.description
    if (result.data.amount !== undefined) updateData.amount = result.data.amount
    if (result.data.receiptUrl !== undefined) updateData.receipt_url = result.data.receiptUrl

    const { data, error } = await supabase
      .from('expenses')
      .update(updateData)
      .eq('id', expenseId)
      .select(`
        *,
        attendee:attendees (*)
      `)
      .single()

    if (error) {
      console.error('Error updating expense:', error)
      return NextResponse.json(
        { error: 'Error al actualizar gasto' },
        { status: 500 }
      )
    }

    // Actualizar exclusiones si se proporcionan
    if (result.data.excludedAttendees !== undefined) {
      // Eliminar exclusiones existentes
      await supabase
        .from('expense_exclusions')
        .delete()
        .eq('expense_id', expenseId)

      // Agregar nuevas exclusiones
      if (result.data.excludedAttendees.length > 0) {
        const exclusions = result.data.excludedAttendees.map(attendeeId => ({
          expense_id: expenseId,
          attendee_id: attendeeId,
        }))
        await supabase.from('expense_exclusions').insert(exclusions)
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PATCH /api/expenses/[expenseId]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { expenseId } = await params
    const supabase = await createClient()

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId)

    if (error) {
      console.error('Error deleting expense:', error)
      return NextResponse.json(
        { error: 'Error al eliminar gasto' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/expenses/[expenseId]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
