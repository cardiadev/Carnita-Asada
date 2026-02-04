'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
} from '@/components/ui/dialog'
import { shoppingTemplates, ShoppingTemplate, ShoppingTemplateItem } from '@/lib/data/shopping-templates'
import { toast } from 'sonner'

interface TemplateSelectorProps {
    eventUuid: string | null
    onItemsAdded: () => void
    categories: Array<{ id: string; name: string }>
}

export function TemplateSelector({ eventUuid, onItemsAdded, categories }: TemplateSelectorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedTemplate, setSelectedTemplate] = useState<ShoppingTemplate | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [step, setStep] = useState<'select' | 'preview'>('select')

    const handleSelectTemplate = (template: ShoppingTemplate) => {
        setSelectedTemplate(template)
        setStep('preview')
    }

    const handleBack = () => {
        setStep('select')
        setSelectedTemplate(null)
    }

    const handleClose = () => {
        setIsOpen(false)
        setStep('select')
        setSelectedTemplate(null)
    }

    const getCategoryId = (categoryName: string): string | undefined => {
        const category = categories.find(
            c => c.name.toLowerCase() === categoryName.toLowerCase()
        )
        return category?.id
    }

    const handleConfirm = async () => {
        if (!selectedTemplate || !eventUuid) return

        setIsLoading(true)
        let addedCount = 0
        let errorCount = 0

        for (const item of selectedTemplate.items) {
            try {
                const res = await fetch('/api/shopping', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        eventId: eventUuid,
                        categoryId: getCategoryId(item.categoryName),
                        name: item.name,
                        quantity: item.quantity,
                        unit: item.unit,
                    }),
                })

                if (res.ok) {
                    addedCount++
                } else {
                    errorCount++
                }
            } catch {
                errorCount++
            }
        }

        setIsLoading(false)

        if (addedCount > 0) {
            toast.success(`${addedCount} items agregados a tu lista`)
            onItemsAdded()
            handleClose()
        }


        if (errorCount > 0) {
            toast.error(`${errorCount} items no se pudieron agregar`)
        }
    }

    const groupedItems = selectedTemplate?.items.reduce((acc, item) => {
        if (!acc[item.categoryName]) {
            acc[item.categoryName] = []
        }
        acc[item.categoryName].push(item)
        return acc
    }, {} as Record<string, ShoppingTemplateItem[]>)

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    📋 Usar plantilla
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>
                        {step === 'select' ? 'Elegir plantilla' : selectedTemplate?.name}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'select'
                            ? 'Selecciona una plantilla para agregar items predefinidos'
                            : `${selectedTemplate?.items.length} items para agregar`}
                    </DialogDescription>
                </DialogHeader>

                {step === 'select' ? (
                    <div className="grid gap-3 py-4">
                        {shoppingTemplates.map((template) => (
                            <Card
                                key={template.id}
                                className="cursor-pointer hover:bg-accent/50 transition-colors"
                                onClick={() => handleSelectTemplate(template)}
                            >
                                <CardContent className="flex items-center gap-4 py-4">
                                    <div className="text-4xl">{template.icon}</div>
                                    <div className="flex-1">
                                        <CardTitle className="text-base">{template.name}</CardTitle>
                                        <CardDescription className="text-sm">
                                            {template.description}
                                        </CardDescription>
                                        <Badge variant="secondary" className="mt-2 text-xs">
                                            {template.items.length} items
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto py-4 space-y-4">
                        {groupedItems && Object.entries(groupedItems).map(([categoryName, items]) => (
                            <div key={categoryName}>
                                <h4 className="font-medium text-sm text-muted-foreground mb-2">
                                    {categoryName}
                                </h4>
                                <div className="space-y-1">
                                    {items.map((item, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between text-sm py-1 px-2 rounded bg-muted/50"
                                        >
                                            <span>{item.name}</span>
                                            <Badge variant="outline" className="text-xs">
                                                {item.quantity} {item.unit}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <DialogFooter className="gap-2 sm:gap-0">
                    {step === 'preview' && (
                        <Button variant="outline" onClick={handleBack} disabled={isLoading}>
                            Atrás
                        </Button>
                    )}
                    {step === 'preview' && (
                        <Button
                            onClick={handleConfirm}
                            disabled={isLoading}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            {isLoading ? 'Agregando...' : 'Agregar todos'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
