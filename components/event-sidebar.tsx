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
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

interface EventSidebarProps extends React.ComponentProps<typeof Sidebar> {
    eventId: string
    eventTitle?: string
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
        title: "Gráficos",
        icon: BarChart3,
        href: "/charts",
    },
]

export function EventSidebar({ eventId, eventTitle, ...props }: EventSidebarProps) {
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
        <Sidebar variant="inset" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={`/${eventId}`}>
                                <div className="bg-orange-500 text-white flex aspect-square size-8 items-center justify-center rounded-lg">
                                    <Flame className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">
                                        {eventTitle || "Carnita Asada"}
                                    </span>
                                    <span className="truncate text-xs text-muted-foreground">
                                        Organiza tu evento
                                    </span>
                                </div>
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
                        <Button
                            variant="outline"
                            className="w-full justify-start gap-2"
                            onClick={handleShare}
                        >
                            <Share2 className="h-4 w-4" />
                            Compartir evento
                        </Button>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
