'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { AlertTriangle } from 'lucide-react'

interface CancelEventDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    eventId: string
    eventTitle: string
    onCancelled: () => void
}

export function CancelEventDialog({
    open,
    onOpenChange,
    eventId,
    eventTitle,
    onCancelled,
}: CancelEventDialogProps) {
    const [confirmText, setConfirmText] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const isConfirmValid = confirmText.trim().toLowerCase() === eventTitle.trim().toLowerCase()

    const handleCancel = async () => {
        if (!isConfirmValid) return

        setIsLoading(true)
        try {
            const res = await fetch(`/api/events/${eventId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cancel: true }),
            })

            if (!res.ok) throw new Error()

            toast.success('Evento cancelado 😢')
            onCancelled()
            onOpenChange(false)
        } catch {
            toast.error('Error al cancelar el evento')
        } finally {
            setIsLoading(false)
        }
    }

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setConfirmText('')
        }
        onOpenChange(open)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        Cancelar Carnita Asada
                    </DialogTitle>
                    <DialogDescription>
                        Esta acción no se puede deshacer. Todos los asistentes verán que el evento fue cancelado.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <p className="text-sm text-red-700 dark:text-red-400">
                            Para confirmar, escribe el nombre del evento:
                        </p>
                        <p className="font-bold text-red-800 dark:text-red-300 mt-1">
                            {eventTitle}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirm">Confirmar nombre del evento</Label>
                        <Input
                            id="confirm"
                            placeholder="Escribe el nombre del evento"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            disabled={isLoading}
                            className={isConfirmValid ? 'border-green-500' : ''}
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={isLoading}
                    >
                        No, mantener
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleCancel}
                        disabled={!isConfirmValid || isLoading}
                    >
                        {isLoading ? 'Cancelando...' : 'Sí, cancelar evento'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
