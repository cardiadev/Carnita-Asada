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
    const [currentIndex, setCurrentIndex] = useState(0)

    if (!receiptUrl) return null

    // Parse URLs
    let urls: string[] = []
    try {
        urls = JSON.parse(receiptUrl)
        if (!Array.isArray(urls)) urls = [receiptUrl]
    } catch {
        urls = [receiptUrl]
    }

    const currentUrl = urls[currentIndex] || urls[0]
    const isPdf = currentUrl?.toLowerCase().includes('.pdf')
    const hasMultiple = urls.length > 1

    const handleNext = () => {
        setIsLoading(true)
        setCurrentIndex((prev) => (prev + 1) % urls.length)
    }

    const handlePrev = () => {
        setIsLoading(true)
        setCurrentIndex((prev) => (prev - 1 + urls.length) % urls.length)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="max-w-none w-full h-full sm:h-auto sm:max-w-3xl sm:max-h-[90vh] p-0 flex flex-col gap-0 overflow-hidden border-none sm:border"
                showCloseButton={false}
            >
                <DialogHeader className="flex flex-row items-center justify-between p-4 border-b bg-white dark:bg-zinc-900 sticky top-0 z-20 shrink-0">
                    <div className="flex flex-col gap-0.5 min-w-0 pr-4">
                        <DialogTitle className="text-base font-semibold truncate">{title}</DialogTitle>
                        {hasMultiple && (
                            <p className="text-xs text-zinc-500">
                                {currentIndex + 1} de {urls.length} comprobantes
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" size="sm" asChild className="h-9">
                            <a href={currentUrl} target="_blank" rel="noopener noreferrer">
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

                <div className="flex-1 relative w-full bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center p-2 sm:p-4 overflow-hidden min-h-[50vh]">
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-100/50 dark:bg-zinc-950/50 z-10">
                            <div className="h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

                    {hasMultiple && (
                        <>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handlePrev}
                                className="absolute left-4 z-20 rounded-full h-10 w-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-none shadow-md hover:scale-105 transition-transform"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleNext}
                                className="absolute right-4 z-20 rounded-full h-10 w-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-none shadow-md hover:scale-105 transition-transform"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                            </Button>
                        </>
                    )}

                    <div className="w-full h-full flex items-center justify-center">
                        {isPdf ? (
                            <iframe
                                src={currentUrl}
                                className="w-full h-full"
                                onLoad={() => setIsLoading(false)}
                                title={title}
                            />
                        ) : (
                            <img
                                src={currentUrl}
                                alt={title}
                                className="max-w-full max-h-full object-contain shadow-2xl rounded-sm transition-opacity duration-300"
                                style={{ opacity: isLoading ? 0.5 : 1 }}
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
