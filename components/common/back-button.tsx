'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface BackButtonProps {
    className?: string
}

export function BackButton({ className }: BackButtonProps) {
    const params = useParams()
    const eventId = params?.eventId as string

    if (!eventId) return null

    return (
        <Button
            variant="ghost"
            size="sm"
            asChild
            className={className}
        >
            <Link href={`/${eventId}`}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Volver
            </Link>
        </Button>
    )
}
