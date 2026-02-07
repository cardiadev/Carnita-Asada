import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    if (!eventId) {
        return NextResponse.json({ error: 'Event ID required' }, { status: 400 })
    }

    try {
        const supabase = await createClient()

        // Get event UUID from nano_id
        const { data: event, error: eventError } = await supabase
            .from('events')
            .select('id')
            .eq('nano_id', eventId)
            .single()

        if (eventError || !event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 })
        }

        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('event_id', event.id)

        if (error) throw error

        return NextResponse.json(data || [])
    } catch (error) {
        console.error('Error fetching payments:', error)
        return NextResponse.json({ error: 'Error fetching payments' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { eventId, fromAttendeeId, toAttendeeId, amount } = body

        if (!eventId || !fromAttendeeId || !toAttendeeId || !amount) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const supabase = await createClient()

        // Get event UUID from nano_id
        const { data: event, error: eventError } = await supabase
            .from('events')
            .select('id')
            .eq('nano_id', eventId)
            .single()

        if (eventError || !event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 })
        }

        // Check if payment already exists
        const { data: existing } = await supabase
            .from('payments')
            .select('id')
            .eq('event_id', event.id)
            .eq('from_attendee_id', fromAttendeeId)
            .eq('to_attendee_id', toAttendeeId)
            .single()

        if (existing) {
            // Update existing payment
            const { data, error } = await supabase
                .from('payments')
                .update({ amount, status: 'completed', updated_at: new Date().toISOString() })
                .eq('id', existing.id)
                .select()
                .single()

            if (error) throw error

            // Revalidate the event page to update the UI
            revalidatePath(`/${eventId}`)
            revalidatePath(`/${eventId}/summary`)

            return NextResponse.json(data)
        }

        // Create new payment
        const { data, error } = await supabase
            .from('payments')
            .insert({
                event_id: event.id,
                from_attendee_id: fromAttendeeId,
                to_attendee_id: toAttendeeId,
                amount,
                status: 'completed'
            })
            .select()
            .single()

        if (error) throw error

        // Revalidate the event page to update the UI
        revalidatePath(`/${eventId}`)
        revalidatePath(`/${eventId}/summary`)

        return NextResponse.json(data, { status: 201 })
    } catch (error) {
        console.error('Error creating payment:', error)
        return NextResponse.json({ error: 'Error creating payment' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('id')

    if (!paymentId) {
        return NextResponse.json({ error: 'Payment ID required' }, { status: 400 })
    }

    try {
        const supabase = await createClient()

        // First get the payment to find the event
        const { data: payment } = await supabase
            .from('payments')
            .select('event_id')
            .eq('id', paymentId)
            .single()

        const { error } = await supabase
            .from('payments')
            .delete()
            .eq('id', paymentId)

        if (error) throw error

        // Revalidate if we found the event
        if (payment?.event_id) {
            // Get nano_id for the event
            const { data: event } = await supabase
                .from('events')
                .select('nano_id')
                .eq('id', payment.event_id)
                .single()

            if (event?.nano_id) {
                revalidatePath(`/${event.nano_id}`)
                revalidatePath(`/${event.nano_id}/summary`)
            }
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting payment:', error)
        return NextResponse.json({ error: 'Error deleting payment' }, { status: 500 })
    }
}
