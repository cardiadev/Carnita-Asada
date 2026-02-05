'use client'

import { use } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Flame, Beef, Droplets, Utensils, Info, Calculator, FlameKindling, ChefHat, Megaphone } from 'lucide-react'

interface SuggestionsPageProps {
    params: Promise<{ eventId: string }>
}

export default function SuggestionsPage({ params }: SuggestionsPageProps) {
    const { eventId } = use(params)

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="mb-8 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900 dark:text-zinc-100 mb-2">
                    Guía Maestra de la Carnita Asada 🥩
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl text-lg">
                    Todo lo que necesitas saber para que tu evento sea legendario. Cantidades, tipos de carne, salsas y consejos de parrillero.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <Card className="bg-orange-50/50 dark:bg-orange-950/10 border-orange-100 dark:border-orange-900/30">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center">
                            <Beef className="h-8 w-8 text-orange-600 mb-3" />
                            <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Cortes Selectos</h3>
                            <p className="text-sm text-zinc-500 mt-1">La base de una buena parrillada es la calidad.</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-red-50/50 dark:bg-red-950/10 border-red-100 dark:border-red-900/30">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center">
                            <FlameKindling className="h-8 w-8 text-red-600 mb-3" />
                            <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Fuego Perfecto</h3>
                            <p className="text-sm text-zinc-500 mt-1">Dominar el calor es dominar el sabor.</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-green-50/50 dark:bg-green-950/10 border-green-100 dark:border-green-900/30">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center">
                            <ChefHat className="h-8 w-8 text-green-600 mb-3" />
                            <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Sazón Único</h3>
                            <p className="text-sm text-zinc-500 mt-1">Secretos para salsas y guarniciones.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col gap-8">
                {/* Guía de Carne */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-8 w-1 bg-orange-600 rounded-full" />
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Guía de Cortes y Cantidades</h2>
                    </div>

                    <Card className="border-zinc-200 dark:border-zinc-700 shadow-sm">
                        <CardHeader className="p-6 pb-4 border-b border-zinc-50 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800/20">
                            <CardTitle className="text-lg flex items-center gap-2 font-semibold">
                                <Calculator className="h-5 w-5 text-orange-500" />
                                Cálculo por Persona
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-10 space-y-4">
                            <div className="flex justify-between items-center p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl">
                                <span className="font-bold text-zinc-700 dark:text-zinc-300">Solo Carne Roja</span>
                                <Badge variant="outline" className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 font-bold px-3 py-1 text-sm">350g - 400g</Badge>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl">
                                <span className="font-bold text-zinc-700 dark:text-zinc-300">Mixto (Pollo, Cerdo, Res)</span>
                                <Badge variant="outline" className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 font-bold px-3 py-1 text-sm">450g - 500g</Badge>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl">
                                <span className="font-bold text-zinc-700 dark:text-zinc-300">Niños</span>
                                <Badge variant="outline" className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 font-bold px-3 py-1 text-sm">150g - 200g</Badge>
                            </div>
                            <p className="text-xs text-zinc-500 font-medium italic mt-4 text-center">
                                * Las cantidades consideran el peso en crudo.
                            </p>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <h3 className="font-bold text-lg text-zinc-800 dark:text-zinc-200">Recomendaciones de Cortes</h3>
                        <div className="flex flex-col gap-4">
                            {[
                                { name: 'Arrachera', desc: 'La favorita por su suavidad y sabor. Marinada es mejor.', rating: 'Muy Popular' },
                                { name: 'Rib Eye', desc: 'Sabor intenso y gran marmoleo. Ideal para término medio.', rating: 'Premium' },
                                { name: 'T-Bone', desc: 'Lo mejor de dos mundos: filete y lomo en un solo corte.', rating: 'Clásico' },
                                { name: 'Picanha', desc: 'Capa de grasa que le da un sabor único. No la quites.', rating: 'Exótico' },
                                { name: 'Sirloin', desc: 'Corte magro pero con mucho sabor. Buen balance calidad-precio.', rating: 'Versátil' }
                            ].map(item => (
                                <div key={item.name} className="flex flex-col p-4 border border-zinc-100 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-zinc-900 dark:text-zinc-100">{item.name}</span>
                                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold text-orange-600 border-orange-200">{item.rating}</Badge>
                                    </div>
                                    <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Consejos de Parrillero */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-8 w-1 bg-red-600 rounded-full" />
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Secretos de la Parrilla</h2>
                    </div>

                    <Card className="border-orange-200 dark:border-orange-800/50 bg-orange-50 dark:bg-orange-950/20 shadow-sm overflow-hidden">
                        <CardContent className="p-8">
                            <div className="flex flex-row items-center gap-6">
                                <div className="shrink-0 bg-orange-100 dark:bg-orange-900/40 p-4 rounded-2xl">
                                    <Megaphone className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                                </div>
                                <p className="text-zinc-700 dark:text-zinc-300 text-lg leading-relaxed italic font-medium">
                                    "Nunca cortes la carne inmediatamente después de sacarla del fuego. Déjala reposar al menos 5-10 minutos tapada con papel aluminio para que los jugos se redistribuyan."
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
                                <h4 className="font-bold flex items-center gap-2 mb-2">
                                    <Flame className="h-4 w-4 text-orange-500" />
                                    Control de Temperatura
                                </h4>
                                <p className="text-sm text-zinc-500">
                                    Usa la regla de la mano: Pon tu mano a 10cm de la parrilla. Si aguantas 2 segundos es fuego alto, 5 segundos fuego medio, 8 segundos fuego bajo.
                                </p>
                            </div>

                            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
                                <h4 className="font-bold flex items-center gap-2 mb-2 text-green-700 dark:text-green-400">
                                    <Droplets className="h-4 w-4" />
                                    Salsa Verde
                                </h4>
                                <ul className="text-xs space-y-1 text-zinc-500">
                                    <li>• 500g Tomatillo asado</li>
                                    <li>• 3 Chiles serranos asados</li>
                                    <li>• 1 diente de Ajo</li>
                                    <li>• Mucho Cilantro fresco</li>
                                    <li>• Sal y pimienta al gusto</li>
                                </ul>
                            </div>

                            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
                                <h4 className="font-bold flex items-center gap-2 mb-2">
                                    <Utensils className="h-4 w-4 text-zinc-400" />
                                    Guarniciones Indispensables
                                </h4>
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {['Quesadillas', 'Cebollitas', 'Nopales', 'Chiles Toreados', 'Frijoles Charros'].map(tag => (
                                        <Badge key={tag} variant="secondary" className="font-normal text-[11px]">{tag}</Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Checklist Final */}
            <section className="mt-16 pb-12">
                <div className="flex items-center gap-3 mb-8">
                    <div className="h-8 w-1 bg-green-600 rounded-full" />
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Checklist de Ultima Hora</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        '¿Compraste el Hielo?',
                        '¿Las cervezas están frías?',
                        '¿Hay suficientes servilletas?',
                        '¿Tienes el link de Maps listo?'
                    ].map(check => (
                        <div key={check} className="flex items-center gap-3 p-4 bg-green-50/50 dark:bg-green-950/10 border border-green-100 dark:border-green-900/30 rounded-xl">
                            <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                                <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                            </div>
                            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{check}</span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}
