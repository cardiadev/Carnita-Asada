'use client'

import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ShareButtonProps {
  eventUrl: string
  eventTitle: string
}

export function ShareButton({ eventUrl, eventTitle }: ShareButtonProps) {
  const handleShare = async () => {
    const shareData = {
      title: eventTitle,
      text: `¡Únete a ${eventTitle}!`,
      url: eventUrl,
    }

    // Intentar usar Web Share API si está disponible
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData)
        return
      } catch (error) {
        // Si el usuario cancela, no hacer nada
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }
      }
    }

    // Fallback: copiar al portapapeles
    try {
      await navigator.clipboard.writeText(eventUrl)
      toast.success('¡Enlace copiado al portapapeles!')
    } catch {
      toast.error('No se pudo copiar el enlace')
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      className="gap-2"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" x2="12" y1="2" y2="15" />
      </svg>
      Compartir
    </Button>
  )
}
