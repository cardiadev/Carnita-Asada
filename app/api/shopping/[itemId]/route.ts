import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateShoppingItemSchema } from '@/lib/validations/shopping'

interface RouteParams {
  params: Promise<{ itemId: string }>
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { itemId } = await params
    const body = await request.json()

    const result = updateShoppingItemSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const updateData: Record<string, unknown> = {}
    if (result.data.name) updateData.name = result.data.name
    if (result.data.quantity !== undefined) updateData.quantity = result.data.quantity
    if (result.data.unit) updateData.unit = result.data.unit
    if (result.data.isPurchased !== undefined) updateData.is_purchased = result.data.isPurchased

    const { data, error } = await supabase
      .from('shopping_items')
      .update(updateData)
      .eq('id', itemId)
      .select(`
        *,
        category:categories (*)
      `)
      .single()

    if (error) {
      console.error('Error updating shopping item:', error)
      return NextResponse.json(
        { error: 'Error al actualizar item' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PATCH /api/shopping/[itemId]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { itemId } = await params
    const supabase = await createClient()

    const { error } = await supabase
      .from('shopping_items')
      .delete()
      .eq('id', itemId)

    if (error) {
      console.error('Error deleting shopping item:', error)
      return NextResponse.json(
        { error: 'Error al eliminar item' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/shopping/[itemId]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
