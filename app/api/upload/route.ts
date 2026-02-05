import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const eventId = formData.get('eventId') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo' },
        { status: 400 }
      )
    }

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId es requerido' },
        { status: 400 }
      )
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Usa JPG, PNG, WebP o PDF' },
        { status: 400 }
      )
    }

    // Validar tamaño (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo es muy grande. Máximo 5MB' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const extension = file.name.split('.').pop() || 'jpg'
    const fileName = `${eventId}/${timestamp}.${extension}`

    // Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Subir a Supabase Storage
    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true, // Changed to true to allow overwrites
      })

    if (error) {
      console.error('Error uploading file:', error)

      // Check for RLS policy error
      if (error.message?.includes('row-level security') || error.statusCode === '403') {
        return NextResponse.json(
          {
            error: 'Error de permisos en Supabase Storage. Ve a Supabase Dashboard > Storage > receipts > Policies y agrega una política INSERT para permitir uploads.',
            details: error.message
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { error: 'Error al subir archivo: ' + error.message },
        { status: 500 }
      )
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('receipts')
      .getPublicUrl(data.path)

    return NextResponse.json({ url: urlData.publicUrl })
  } catch (error) {
    console.error('Error in POST /api/upload:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
