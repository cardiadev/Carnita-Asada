'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, X } from 'lucide-react'

interface ReceiptModalProps {
    isOpen: boolean
    onClose: () => void
    receiptUrl: string
    title?: string
}

export function ReceiptModal({ isOpen, onClose, receiptUrl, title = 'Comprobante' }: ReceiptModalProps) {
    const [isLoading, setIsLoading] = useState(true)

    const isPdf = receiptUrl.toLowerCase().includes('.pdf')

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
                <DialogHeader className="flex flex-row items-center justify-between">
                    <DialogTitle>{title}</DialogTitle>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <a href={receiptUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4 mr-2" />
                                Descargar
                            </a>
                        </Button>
                    </div>
                </DialogHeader>

                <div className="relative w-full h-[70vh] bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden">
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

                    {isPdf ? (
                        <iframe
                            src={receiptUrl}
                            className="w-full h-full"
                            onLoad={() => setIsLoading(false)}
                            title={title}
                        />
                    ) : (
                        <img
                            src={receiptUrl}
                            alt={title}
                            className="w-full h-full object-contain"
                            onLoad={() => setIsLoading(false)}
                            onError={() => setIsLoading(false)}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
