import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateAttendeeSchema } from '@/lib/validations/attendee'

interface RouteParams {
  params: Promise<{ attendeeId: string }>
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { attendeeId } = await params
    const body = await request.json()

    const result = updateAttendeeSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const updateData: Record<string, unknown> = {}
    if (result.data.name) updateData.name = result.data.name
    if (result.data.excludeFromSplit !== undefined) {
      updateData.exclude_from_split = result.data.excludeFromSplit
    }

    const { data, error } = await supabase
      .from('attendees')
      .update(updateData)
      .eq('id', attendeeId)
      .select()
      .single()

    if (error) {
      console.error('Error updating attendee:', error)
      return NextResponse.json(
        { error: 'Error al actualizar asistente' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PATCH /api/attendees/[attendeeId]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { attendeeId } = await params
    const supabase = await createClient()

    const { error } = await supabase
      .from('attendees')
      .delete()
      .eq('id', attendeeId)

    if (error) {
      console.error('Error deleting attendee:', error)
      return NextResponse.json(
        { error: 'Error al eliminar asistente' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/attendees/[attendeeId]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
