'use client'

import { useState, useEffect, use } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import type { Expense, Attendee } from '@/types/database'

interface ChartsPageProps {
    params: Promise<{ eventId: string }>
}

type ExpenseWithAttendee = Expense & {
    attendee: Attendee | null
}

export default function ChartsPage({ params }: ChartsPageProps) {
    const { eventId } = use(params)
    const [expenses, setExpenses] = useState<ExpenseWithAttendee[]>([])
    const [attendees, setAttendees] = useState<Attendee[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const eventRes = await fetch(`/api/events/${eventId}`)
                const eventData = await eventRes.json()
                if (eventRes.ok) {
                    setAttendees(eventData.attendees || [])
                }

                const expRes = await fetch(`/api/expenses?eventId=${eventId}`)
                const expData = await expRes.json()
                if (expRes.ok) setExpenses(expData)
            } catch (error) {
                console.error('Error fetching data:', error)
                toast.error('Error al cargar los datos')
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [eventId])

    // Calcular datos para gráficos
    const expensesByPerson = attendees.map(attendee => {
        const total = expenses
            .filter(e => e.attendee_id === attendee.id)
            .reduce((sum, e) => sum + Number(e.amount), 0)
        return { name: attendee.name, total }
    }).filter(p => p.total > 0)

    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
    const activeAttendees = attendees.filter(a => !a.exclude_from_split)
    const perPerson = activeAttendees.length > 0 ? totalExpenses / activeAttendees.length : 0

    // Estado de pagos
    const paymentStatus = attendees
        .filter(a => !a.exclude_from_split)
        .map(attendee => {
            const paid = expenses
                .filter(e => e.attendee_id === attendee.id)
                .reduce((sum, e) => sum + Number(e.amount), 0)
            const balance = paid - perPerson
            return {
                name: attendee.name,
                paid,
                balance,
                status: balance >= 0 ? 'pagado' : 'pendiente'
            }
        })

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-6 max-w-4xl">
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i}>
                            <CardContent className="py-4">
                                <div className="h-48 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-6 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    Gráficos
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Visualización de gastos y pagos
                </p>
            </div>

            <div className="grid gap-6">
                {/* Gastos por persona */}
                <Card>
                    <CardHeader>
                        <CardTitle>Gastos por persona</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {expensesByPerson.length === 0 ? (
                            <p className="text-center text-zinc-500 py-8">No hay gastos registrados</p>
                        ) : (
                            <div className="space-y-3">
                                {expensesByPerson
                                    .sort((a, b) => b.total - a.total)
                                    .map((person, index) => {
                                        const maxAmount = Math.max(...expensesByPerson.map(p => p.total))
                                        const percentage = (person.total / maxAmount) * 100
                                        return (
                                            <div key={index} className="space-y-1">
                                                <div className="flex justify-between text-sm">
                                                    <span className="font-medium">{person.name}</span>
                                                    <span className="text-zinc-500">${person.total.toFixed(2)}</span>
                                                </div>
                                                <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-orange-500 rounded-full transition-all duration-500"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Estado de pagos */}
                <Card>
                    <CardHeader>
                        <CardTitle>Estado de pagos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {paymentStatus.length === 0 ? (
                            <p className="text-center text-zinc-500 py-8">No hay asistentes registrados</p>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {paymentStatus.map((person, index) => (
                                    <div
                                        key={index}
                                        className={`p-4 rounded-lg border ${person.status === 'pagado'
                                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                            }`}
                                    >
                                        <p className="font-medium text-sm truncate">{person.name}</p>
                                        <p className={`text-xs mt-1 ${person.status === 'pagado'
                                                ? 'text-green-600 dark:text-green-400'
                                                : 'text-red-600 dark:text-red-400'
                                            }`}>
                                            {person.status === 'pagado'
                                                ? `+$${person.balance.toFixed(2)}`
                                                : `-$${Math.abs(person.balance).toFixed(2)}`
                                            }
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Resumen rápido */}
                <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
                        <CardContent className="py-4">
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">Total gastado</p>
                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                ${totalExpenses.toFixed(2)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="py-4">
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">Por persona</p>
                            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                                ${perPerson.toFixed(2)}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
