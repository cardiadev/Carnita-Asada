'use client'

import { useState, useEffect, use, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import * as d3 from 'd3'
import type { Expense, Attendee } from '@/types/database'

interface ChartsPageProps {
    params: Promise<{ eventId: string }>
}

type ExpenseWithAttendee = Expense & {
    attendee: Attendee | null
}

interface PieData {
    name: string
    value: number
}

export default function ChartsPage({ params }: ChartsPageProps) {
    const { eventId } = use(params)
    const [expenses, setExpenses] = useState<ExpenseWithAttendee[]>([])
    const [attendees, setAttendees] = useState<Attendee[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const pieChartRef = useRef<SVGSVGElement>(null)
    const barChartRef = useRef<SVGSVGElement>(null)
    const donutChartRef = useRef<SVGSVGElement>(null)

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

    // Calculate data
    const expensesByPerson = attendees.map(attendee => {
        const total = expenses
            .filter(e => e.attendee_id === attendee.id)
            .reduce((sum, e) => sum + Number(e.amount), 0)
        return { name: attendee.name, total }
    }).filter(p => p.total > 0)

    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
    const activeAttendees = attendees.filter(a => !a.exclude_from_split)
    const perPerson = activeAttendees.length > 0 ? totalExpenses / activeAttendees.length : 0

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

    // Pie Chart
    useEffect(() => {
        if (!pieChartRef.current || expensesByPerson.length === 0) return

        const container = pieChartRef.current.parentElement
        if (!container) return

        const svg = d3.select(pieChartRef.current)
        svg.selectAll('*').remove()

        const width = Math.min(container.clientWidth, 400)
        const height = 300
        const radius = Math.min(width, height) / 2 - 20

        const g = svg
            .attr('width', '100%')
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .append('g')
            .attr('transform', `translate(${width / 2}, ${height / 2})`)

        const color = d3.scaleOrdinal<string>()
            .domain(expensesByPerson.map(d => d.name))
            .range(['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5', '#ea580c', '#c2410c'])

        const pie = d3.pie<PieData>()
            .value(d => d.value)
            .sort(null)

        const arc = d3.arc<d3.PieArcDatum<PieData>>()
            .innerRadius(radius * 0.4) // Semi-donut looks more modern
            .outerRadius(radius)
            .cornerRadius(4)

        const data: PieData[] = expensesByPerson.map(d => ({ name: d.name, value: d.total }))

        const arcs = g.selectAll('.arc')
            .data(pie(data))
            .enter()
            .append('g')
            .attr('class', 'arc')

        arcs.append('path')
            .attr('d', arc)
            .attr('fill', d => color(d.data.name))
            .attr('stroke', 'white')
            .attr('stroke-width', 2)
            .style('transition', 'all 0.3s')
            .on('mouseover', function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('d', (d: any) => d3.arc<d3.PieArcDatum<PieData>>()
                        .innerRadius(radius * 0.4)
                        .outerRadius(radius + 10)
                        .cornerRadius(4)(d)
                    )
            })
            .on('mouseout', function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('d', (d: any) => arc(d))
            })

    }, [expensesByPerson])

    // Bar Chart
    useEffect(() => {
        if (!barChartRef.current || expensesByPerson.length === 0) return

        const container = barChartRef.current.parentElement
        if (!container) return

        const svg = d3.select(barChartRef.current)
        svg.selectAll('*').remove()

        const margin = { top: 20, right: 30, bottom: 40, left: 100 }
        const width = container.clientWidth - margin.left - margin.right
        const height = Math.max(250, expensesByPerson.length * 45)

        const g = svg
            .attr('width', '100%')
            .attr('height', height + margin.top + margin.bottom)
            .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`)

        const sortedData = [...expensesByPerson].sort((a, b) => b.total - a.total)

        const x = d3.scaleLinear()
            .domain([0, d3.max(sortedData, d => d.total) || 0])
            .range([0, width])

        const y = d3.scaleBand()
            .domain(sortedData.map(d => d.name))
            .range([0, height])
            .padding(0.2)

        g.selectAll('.bar-bg')
            .data(sortedData)
            .enter()
            .append('rect')
            .attr('class', 'bar-bg')
            .attr('y', d => y(d.name) || 0)
            .attr('height', y.bandwidth())
            .attr('x', 0)
            .attr('width', width)
            .attr('fill', '#f4f4f5')
            .attr('rx', 6)

        g.selectAll('.bar')
            .data(sortedData)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('y', d => y(d.name) || 0)
            .attr('height', y.bandwidth())
            .attr('x', 0)
            .attr('width', 0)
            .attr('fill', 'url(#bar-gradient)')
            .attr('rx', 6)
            .transition()
            .duration(1000)
            .attr('width', d => x(d.total))

        // Add Gradient
        const defs = svg.append('defs')
        const gradient = defs.append('linearGradient')
            .attr('id', 'bar-gradient')
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '100%')
            .attr('y2', '0%')

        gradient.append('stop').attr('offset', '0%').attr('stop-color', '#ea580c')
        gradient.append('stop').attr('offset', '100%').attr('stop-color', '#fb923c')

        g.append('g')
            .call(d3.axisLeft(y).tickSize(0))
            .selectAll('text')
            .attr('font-size', '14px')
            .attr('font-weight', '500')
            .attr('dx', '-10px')
            .attr('class', 'fill-zinc-600 dark:fill-zinc-400')

        g.append('g')
            .attr('transform', `translate(0, ${height})`)
            .call(d3.axisBottom(x).ticks(5).tickFormat(d => `$${d}`).tickSize(-height))
            .selectAll('text')
            .attr('font-size', '14px')
            .attr('dy', '15px')
            .attr('class', 'fill-zinc-400')

        g.selectAll('.domain, .tick line').attr('stroke', '#e4e4e7').attr('stroke-dasharray', '4,4')

    }, [expensesByPerson])

    // Donut Chart for payment status
    useEffect(() => {
        if (!donutChartRef.current || paymentStatus.length === 0) return

        const svg = d3.select(donutChartRef.current)
        svg.selectAll('*').remove()

        const width = 200
        const height = 200
        const radius = Math.min(width, height) / 2 - 10

        const g = svg
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', `translate(${width / 2}, ${height / 2})`)

        const paid = paymentStatus.filter(p => p.status === 'pagado').length
        const pending = paymentStatus.filter(p => p.status === 'pendiente').length

        const data = [
            { label: 'Al día', value: paid, color: '#22c55e' },
            { label: 'Pendiente', value: pending, color: '#ef4444' }
        ].filter(d => d.value > 0)

        const pie = d3.pie<{ label: string; value: number; color: string }>()
            .value(d => d.value)
            .sort(null)

        const arc = d3.arc<d3.PieArcDatum<{ label: string; value: number; color: string }>>()
            .innerRadius(radius * 0.6)
            .outerRadius(radius)

        g.selectAll('.arc')
            .data(pie(data))
            .enter()
            .append('path')
            .attr('d', arc)
            .attr('fill', d => d.data.color)
            .attr('stroke', 'white')
            .attr('stroke-width', 2)

        // Center text
        g.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '-0.2em')
            .attr('font-size', '24px')
            .attr('font-weight', 'bold')
            .attr('fill', paid === paymentStatus.length ? '#22c55e' : '#ef4444')
            .text(`${paid}/${paymentStatus.length}`)

        g.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '1.2em')
            .attr('font-size', '14px')
            .attr('fill', '#71717a')
            .text('al día')

    }, [paymentStatus])

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-6 max-w-4xl">
                <div className="grid gap-6">
                    {/* Summary Stats Skeletons */}
                    <div className="grid grid-cols-2 gap-4">
                        {[...Array(2)].map((_, i) => (
                            <Card key={i}>
                                <CardContent className="p-4">
                                    <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-700 rounded mb-2 animate-pulse" />
                                    <div className="h-8 w-32 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Charts Skeletons */}
                    {[...Array(2)].map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-4">
                                <div className="h-64 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
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
                    Reporte
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Visualización de gastos y pagos
                </p>
            </div>

            <div className="grid gap-6">
                {/* Summary Stats at the top */}
                <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 overflow-hidden">
                        <CardContent className="p-4">
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">Total gastado</p>
                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                ${totalExpenses.toFixed(2)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="overflow-hidden bg-zinc-50 dark:bg-zinc-900/50">
                        <CardContent className="p-4">
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">Por persona</p>
                            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                                ${perPerson.toFixed(2)}
                            </p>
                        </CardContent>
                    </Card>
                </div>
                {/* Pie Chart */}
                <Card className="overflow-hidden">
                    <CardHeader className="p-4 pb-2 border-b border-zinc-50 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800/20">
                        <CardTitle>Distribución de gastos</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        {expensesByPerson.length === 0 ? (
                            <p className="text-center text-zinc-500 py-8">No hay gastos registrados</p>
                        ) : (
                            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                                <svg ref={pieChartRef} />
                                <div className="space-y-2">
                                    {expensesByPerson.map((person, i) => (
                                        <div key={person.name} className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'][i % 5] }}
                                            />
                                            <span className="text-sm">{person.name}: ${person.total.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Bar Chart */}
                <Card className="overflow-hidden">
                    <CardHeader className="p-4 pb-2 border-b border-zinc-50 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800/20">
                        <CardTitle>Gastos por persona</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 overflow-x-auto">
                        {expensesByPerson.length === 0 ? (
                            <p className="text-center text-zinc-500 py-8">No hay gastos registrados</p>
                        ) : (
                            <svg ref={barChartRef} />
                        )}
                    </CardContent>
                </Card>

                {/* Payment Status */}
                <Card className="overflow-hidden">
                    <CardHeader className="p-4 pb-2 border-b border-zinc-50 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800/20">
                        <CardTitle>Estado de pagos</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        {paymentStatus.length === 0 ? (
                            <p className="text-center text-zinc-500 py-8">No hay asistentes registrados</p>
                        ) : (
                            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                                <svg ref={donutChartRef} />
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {paymentStatus.map((person) => (
                                        <div
                                            key={person.name}
                                            className={`p-3 rounded-lg border ${person.status === 'pagado'
                                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                                }`}
                                        >
                                            <p className="font-medium text-sm truncate">{person.name}</p>
                                            <p className={`text-sm mt-1 ${person.status === 'pagado'
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
                            </div>
                        )}
                    </CardContent>
                </Card>


            </div>
        </div>
    )
}
