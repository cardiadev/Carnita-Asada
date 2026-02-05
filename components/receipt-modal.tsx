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

    if (!receiptUrl) return null

    const isPdf = receiptUrl.toLowerCase().includes('.pdf')

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="max-w-none w-full h-full sm:h-auto sm:max-w-3xl sm:max-h-[90vh] p-0 flex flex-col gap-0 overflow-hidden border-none sm:border"
                showCloseButton={false}
            >
                <DialogHeader className="flex flex-row items-center justify-between p-4 border-b bg-white dark:bg-zinc-900 sticky top-0 z-20 shrink-0">
                    <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild className="h-9">
                            <a href={receiptUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Descargar</span>
                            </a>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="h-9 w-9 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 relative w-full bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-100/50 dark:bg-zinc-950/50 z-10">
                            <div className="h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

                    <div className="w-full h-full flex items-center justify-center">
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
                                className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
                                onLoad={() => setIsLoading(false)}
                                onError={() => setIsLoading(false)}
                            />
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
