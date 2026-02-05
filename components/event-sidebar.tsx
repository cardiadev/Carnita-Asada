"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    Flame,
    Home,
    Users,
    ShoppingCart,
    Receipt,
    PieChart,
    BarChart3,
    Share2,
    XCircle,
    Heart,
    Settings,
    Lightbulb,
    ChefHat,
} from "lucide-react"
import { toast } from "sonner"

import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarFooter,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

interface EventSidebarProps extends React.ComponentProps<typeof Sidebar> {
    eventId: string
    eventTitle?: string
    onCancelClick?: () => void
}

const navItems = [
    {
        title: "Inicio",
        icon: Home,
        href: "",
    },
    {
        title: "Asistentes",
        icon: Users,
        href: "/attendees",
    },
    {
        title: "Compras",
        icon: ShoppingCart,
        href: "/shopping",
    },
    {
        title: "Gastos",
        icon: Receipt,
        href: "/expenses",
    },
    {
        title: "Pagos",
        icon: PieChart,
        href: "/summary",
    },
    {
        title: "Sugerencias",
        icon: Lightbulb,
        href: "/suggestions",
    },
    {
        title: "Recetas",
        icon: ChefHat,
        href: "/recipes",
    },
    {
        title: "Reporte",
        icon: BarChart3,
        href: "/report",
    },
    {
        title: "Ajustes",
        icon: Settings,
        href: "/settings",
    },
]

export function EventSidebar({ eventId, eventTitle, onCancelClick, ...props }: EventSidebarProps) {
    const pathname = usePathname()
    const { state } = useSidebar()
    const isCollapsed = state === "collapsed"

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
                return
            } catch {
                // fallback to clipboard
            }
        }

        try {
            await navigator.clipboard.writeText(eventUrl)
            toast.success('¡Link copiado al portapapeles!')
        } catch {
            toast.error('No se pudo copiar el link')
        }
    }

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild tooltip={eventTitle || "Carnita Asada"}>
                            <Link href={`/${eventId}`}>
                                <div className="bg-orange-500 text-white flex aspect-square size-8 items-center justify-center rounded-lg">
                                    <Flame className="size-4" />
                                </div>
                                {!isCollapsed && (
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">
                                            Carnita Asada
                                        </span>
                                        <span className="truncate text-xs text-muted-foreground">
                                            ¿Se va armar?
                                        </span>
                                    </div>
                                )}
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Navegación</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map((item) => {
                                const href = `/${eventId}${item.href}`
                                const isActive = pathname === href

                                return (
                                    <SidebarMenuItem key={item.href}>
                                        <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                                            <Link href={href}>
                                                <item.icon />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton tooltip="Compartir evento" onClick={handleShare}>
                            <Share2 className="h-4 w-4" />
                            <span>Compartir evento</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    {onCancelClick && (
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                tooltip="Cancelar evento"
                                onClick={onCancelClick}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                                <XCircle className="h-4 w-4" />
                                <span>Cancelar evento</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )}
                </SidebarMenu>
                {!isCollapsed && (
                    <div className="px-3 py-2 text-xs text-muted-foreground text-center border-t">
                        <p className="flex items-center justify-center gap-1">
                            Creado con <Heart className="h-3 w-3 text-red-500 fill-red-500" /> por{' '}
                            <a
                                href="https://carlosdiaz.dev"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-orange-600 hover:underline"
                            >
                                Carlos Diaz
                            </a>
                        </p>
                    </div>
                )}
            </SidebarFooter>
        </Sidebar>
    )
}
