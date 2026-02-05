'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
    Home,
    Users,
    ShoppingCart,
    Receipt,
    PieChart,
    BarChart3,
    Settings,
    Lightbulb,
    ChefHat,
    X,
    Share2,
    XCircle,
} from 'lucide-react'

interface MobileMenuProps {
    eventId: string
    eventTitle: string
    isOpen: boolean
    onClose: () => void
    onCancelClick?: () => void
}

const navItems = [
    { title: 'Inicio', icon: Home, href: '' },
    { title: 'Asistentes', icon: Users, href: '/attendees' },
    { title: 'Compras', icon: ShoppingCart, href: '/shopping' },
    { title: 'Gastos', icon: Receipt, href: '/expenses' },
    { title: 'Pagos', icon: PieChart, href: '/summary' },
    { title: 'Sugerencias', icon: Lightbulb, href: '/suggestions' },
    { title: 'Recetas', icon: ChefHat, href: '/recipes' },
    { title: 'Reporte', icon: BarChart3, href: '/report' },
    { title: 'Ajustes', icon: Settings, href: '/settings' },
]

export function MobileMenu({ eventId, eventTitle, isOpen, onClose, onCancelClick }: MobileMenuProps) {
    const pathname = usePathname()

    const handleShare = async () => {
        const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
        const eventUrl = `${appUrl}/${eventId}`
        const shareText = `🔥 ¡Únete a ${eventTitle || 'nuestra carnita asada'}!\n\n${eventUrl}`

        if (navigator.share) {
            try {
                await navigator.share({
                    title: eventTitle || 'Carnita Asada',
                    text: shareText,
                    url: eventUrl,
                })
                onClose()
                return
            } catch {
                // fallback to clipboard
            }
        }

        try {
            await navigator.clipboard.writeText(eventUrl)
            toast.success('¡Link copiado al portapapeles!')
            onClose()
        } catch {
            toast.error('No se pudo copiar el link')
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Menu Content */}
            <div className="absolute inset-0 bg-white dark:bg-zinc-900 flex flex-col">
                {/* Header */}
                <header className="flex items-center justify-between h-14 px-4 border-b border-zinc-200 dark:border-zinc-800">
                    <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {eventTitle}
                    </h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </header>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-1">
                        {navItems.map((item) => {
                            const href = `/${eventId}${item.href}`
                            const isActive = pathname === href

                            return (
                                <Link
                                    key={item.href}
                                    href={href}
                                    onClick={onClose}
                                    className={cn(
                                        'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                                        isActive
                                            ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                    )}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.title}
                                </Link>
                            )
                        })}
                    </div>
                </nav>

                {/* Footer Actions */}
                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                    <Button
                        variant="outline"
                        className="w-full justify-start gap-3"
                        onClick={handleShare}
                    >
                        <Share2 className="h-5 w-5" />
                        Compartir evento
                    </Button>
                    {onCancelClick && (
                        <Button
                            variant="outline"
                            className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => {
                                onCancelClick()
                                onClose()
                            }}
                        >
                            <XCircle className="h-5 w-5" />
                            Cancelar evento
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
