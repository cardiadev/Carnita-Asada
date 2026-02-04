import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Create bank info
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { attendeeId, holder_name, bank_name, clabe, account_number } = body

        if (!attendeeId || !holder_name || !bank_name || !clabe) {
            return NextResponse.json(
                { error: 'Faltan campos requeridos' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        const { data, error } = await supabase
            .from('bank_info')
            .insert({
                attendee_id: attendeeId,
                holder_name,
                bank_name,
                clabe,
                account_number: account_number || null,
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating bank info:', error)
            return NextResponse.json(
                { error: 'Error al crear información bancaria' },
                { status: 500 }
            )
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error in POST /api/bank-info:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

// PUT - Update bank info
export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { id, holder_name, bank_name, clabe, account_number } = body

        if (!id || !holder_name || !bank_name || !clabe) {
            return NextResponse.json(
                { error: 'Faltan campos requeridos' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        const { data, error } = await supabase
            .from('bank_info')
            .update({
                holder_name,
                bank_name,
                clabe,
                account_number: account_number || null,
            })
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Error updating bank info:', error)
            return NextResponse.json(
                { error: 'Error al actualizar información bancaria' },
                { status: 500 }
            )
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error in PUT /api/bank-info:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

// GET - Get bank info by attendee ID
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const attendeeId = searchParams.get('attendeeId')

        if (!attendeeId) {
            return NextResponse.json(
                { error: 'attendeeId es requerido' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        const { data, error } = await supabase
            .from('bank_info')
            .select('*')
            .eq('attendee_id', attendeeId)
            .single()

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching bank info:', error)
            return NextResponse.json(
                { error: 'Error al obtener información bancaria' },
                { status: 500 }
            )
        }

        return NextResponse.json(data || null)
    } catch (error) {
        console.error('Error in GET /api/bank-info:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
