'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Copy, Check, CreditCard, Building2, Hash, User } from 'lucide-react'

interface BankInfo {
    id?: string
    holder_name: string
    bank_name: string
    clabe: string
    account_number?: string
}

interface BankInfoCardProps {
    attendeeId: string
    attendeeName: string
    bankInfo?: BankInfo | null
    onBankInfoSaved?: () => void
}

export function BankInfoCard({ attendeeId, attendeeName, bankInfo, onBankInfoSaved }: BankInfoCardProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [copiedField, setCopiedField] = useState<string | null>(null)

    const [formData, setFormData] = useState<BankInfo>({
        holder_name: bankInfo?.holder_name || '',
        bank_name: bankInfo?.bank_name || '',
        clabe: bankInfo?.clabe || '',
        account_number: bankInfo?.account_number || '',
    })

    const handleCopy = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedField(field)
            setTimeout(() => setCopiedField(null), 2000)
            toast.success('Copiado al portapapeles')
        } catch {
            toast.error('No se pudo copiar')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.holder_name || !formData.bank_name || !formData.clabe) {
            toast.error('Por favor completa los campos requeridos')
            return
        }

        setIsLoading(true)

        try {
            const res = await fetch('/api/bank-info', {
                method: bankInfo?.id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: bankInfo?.id,
                    attendeeId,
                    ...formData,
                }),
            })

            if (!res.ok) {
                throw new Error('Error al guardar')
            }

            toast.success('Datos bancarios guardados')
            setIsOpen(false)
            onBankInfoSaved?.()
        } catch {
            toast.error('Error al guardar datos bancarios')
        } finally {
            setIsLoading(false)
        }
    }

    const CopyButton = ({ text, field }: { text: string; field: string }) => (
        <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => handleCopy(text, field)}
        >
            {copiedField === field ? (
                <Check className="h-4 w-4 text-green-500" />
            ) : (
                <Copy className="h-4 w-4 text-muted-foreground" />
            )}
        </Button>
    )

    // Si tiene datos bancarios, mostrar la tarjeta con opción de copiar
    if (bankInfo) {
        return (
            <Card className="mt-3 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Datos para transferencia
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-3.5 w-3.5" />
                            <span>Titular:</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="font-medium">{bankInfo.holder_name}</span>
                            <CopyButton text={bankInfo.holder_name} field="holder" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Building2 className="h-3.5 w-3.5" />
                            <span>Banco:</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="font-medium">{bankInfo.bank_name}</span>
                            <CopyButton text={bankInfo.bank_name} field="bank" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Hash className="h-3.5 w-3.5" />
                            <span>CLABE:</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="font-mono font-medium">{bankInfo.clabe}</span>
                            <CopyButton text={bankInfo.clabe} field="clabe" />
                        </div>
                    </div>

                    {bankInfo.account_number && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Hash className="h-3.5 w-3.5" />
                                <span>Cuenta:</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="font-mono font-medium">{bankInfo.account_number}</span>
                                <CopyButton text={bankInfo.account_number} field="account" />
                            </div>
                        </div>
                    )}

                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button variant="link" size="sm" className="h-auto p-0 text-blue-600">
                                Editar datos
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Editar datos bancarios</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="holder_name">Nombre del titular *</Label>
                                    <Input
                                        id="holder_name"
                                        value={formData.holder_name}
                                        onChange={(e) => setFormData({ ...formData, holder_name: e.target.value })}
                                        placeholder="Nombre completo"
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bank_name">Banco *</Label>
                                    <Input
                                        id="bank_name"
                                        value={formData.bank_name}
                                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                                        placeholder="Ej: BBVA, Banorte, etc."
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="clabe">CLABE interbancaria *</Label>
                                    <Input
                                        id="clabe"
                                        value={formData.clabe}
                                        onChange={(e) => setFormData({ ...formData, clabe: e.target.value })}
                                        placeholder="18 dígitos"
                                        maxLength={18}
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="account_number">Número de cuenta (opcional)</Label>
                                    <Input
                                        id="account_number"
                                        value={formData.account_number}
                                        onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                                        placeholder="Número de cuenta"
                                        disabled={isLoading}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={isLoading} className="bg-orange-600 hover:bg-orange-700">
                                        {isLoading ? 'Guardando...' : 'Guardar'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>
        )
    }

    // Si no tiene datos, mostrar botón para agregar
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="mt-2">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Agregar datos bancarios
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Datos bancarios de {attendeeName}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="holder_name">Nombre del titular *</Label>
                        <Input
                            id="holder_name"
                            value={formData.holder_name}
                            onChange={(e) => setFormData({ ...formData, holder_name: e.target.value })}
                            placeholder="Nombre completo"
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bank_name">Banco *</Label>
                        <Input
                            id="bank_name"
                            value={formData.bank_name}
                            onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                            placeholder="Ej: BBVA, Banorte, etc."
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="clabe">CLABE interbancaria *</Label>
                        <Input
                            id="clabe"
                            value={formData.clabe}
                            onChange={(e) => setFormData({ ...formData, clabe: e.target.value })}
                            placeholder="18 dígitos"
                            maxLength={18}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="account_number">Número de cuenta (opcional)</Label>
                        <Input
                            id="account_number"
                            value={formData.account_number}
                            onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                            placeholder="Número de cuenta"
                            disabled={isLoading}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading} className="bg-orange-600 hover:bg-orange-700">
                            {isLoading ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
