'use client'

import { use } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Utensils, Flame, ChefHat, Leaf, Beer } from 'lucide-react'

interface RecipesPageProps {
    params: Promise<{ eventId: string }>
}

export default function RecipesPage({ params }: RecipesPageProps) {
    const { eventId } = use(params)

    const items = [
        {
            category: 'Salsas',
            icon: <Flame className="h-5 w-5 text-red-500" />,
            recipes: [
                {
                    name: 'Salsa Verde Asada',
                    description: 'El clásico indispensable. Asar todo le da el toque.',
                    ingredients: ['500g Tomatillo', '3-4 Chiles Serranos', '1/4 Cebolla', '1 Diente de ajo', 'Cilantro fresco'],
                    process: 'Asa los tomatillos, chiles, cebolla y ajo en el asador hasta que estén tatemados. Molcajetea o licúa pulsando poco a poco. Agrega sal y cilantro picado al final.'
                },
                {
                    name: 'Salsa Borracha',
                    description: 'Con un toque de cerveza oscura para realzar la carne.',
                    ingredients: ['4 tomates huaje', '3 chiles pasilla (secos)', '1/2 taza cerveza oscura', '1 ajo', 'Sal de grano'],
                    process: 'Tuesta los chiles ligeramente (sin quemar). Asa tomates y ajo. Hidrata los chiles en la cerveza caliente. Licúa todo junto dejando textura.'
                },
                {
                    name: 'Guacamole Parrillero',
                    description: 'Cremoso y con trocitos de verduras asadas.',
                    ingredients: ['3 Aguacates maduros', '1 Tomate asado picado', '1/4 Cebolla asada picada', 'Limón y Sal'],
                    process: 'Machaca los aguacates. Agrega el tomate y cebolla previamente asados y picados en cubitos. Sazona con limón y suficiente sal.'
                }
            ]
        },
        {
            category: 'Marinade & Rub',
            icon: <Beer className="h-5 w-5 text-amber-500" />,
            recipes: [
                {
                    name: 'Marinada Clásica Norteña',
                    description: 'Ideal para Arrachera, Aguja o Diezmillo.',
                    ingredients: ['1 Cerveza clara', 'Jugo de 4 limones', 'Salsa inglesa (3 cdas)', 'Pimienta negra molida'],
                    process: 'Mezcla todo en un recipiente. Marina la carne mínimo 2 horas (idealmente 4) en el refrigerador. Escurre antes de poner al fuego.'
                },
                {
                    name: 'Rub Seco (Dry Rub)',
                    description: 'Para cortes gruesos como Rib Eye o New York.',
                    ingredients: ['Sal de mar (base)', 'Pimienta negra quebrada', 'Ajo en polvo', 'Paprika (opcional)'],
                    process: 'Mezcla partes iguales de sal y pimienta, y una parte menor de ajo. Cubre generosamente la carne justo antes de asar. Deja reposar 10 min.'
                }
            ]
        },
        {
            category: 'Guarniciones',
            icon: <Leaf className="h-5 w-5 text-green-500" />,
            recipes: [
                {
                    name: 'Cebollitas Preparadas',
                    description: 'No pueden faltar. Sazonadas con salsas negras.',
                    ingredients: ['Manojo de cebollitas', 'Salsa Maggi', 'Salsa Inglesa', 'Limón', 'Sal'],
                    process: 'Asa las cebollitas directas al fuego hasta que suavicen. Pone en un papel aluminio, baña con las salsas y limón, cierra y deja sudar 5 min.'
                },
                {
                    name: 'Papas al Plomo',
                    description: 'Suaves por dentro, con sabor a mantequilla.',
                    ingredients: ['Papas blancas medianas', 'Mantequilla', 'Sal y Pimienta', 'Romero (opcional)'],
                    process: 'Lava las papas. Haz cortes transversales sin llegar al fondo (hasselback) o picalas con tenedor. Unta mantequilla, salpimenta y envuelve en doble aluminio. Directo a las brasas 30-40 min.'
                }
            ]
        }
    ]

    return (
        <div className="container mx-auto px-4 py-6 max-w-4xl h-[calc(100vh-4rem)] flex flex-col">
            <div className="flex items-center gap-3 mb-6 shrink-0">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <ChefHat className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                        Recetas y Tips
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        El secreto está en los detalles
                    </p>
                </div>
            </div>

            <ScrollArea className="flex-1 pr-4">
                <div className="space-y-8 pb-8">
                    {items.map((section, idx) => (
                        <section key={idx} className="space-y-4">
                            <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                                {section.icon}
                                <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">
                                    {section.category}
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {section.recipes.map((recipe, rIdx) => (
                                    <Card key={rIdx} className="border-zinc-200 dark:border-zinc-800 h-full hover:shadow-md transition-shadow">
                                        <CardHeader className="p-4 pb-2">
                                            <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                                                {recipe.name}
                                            </CardTitle>
                                            <p className="text-sm text-zinc-500 leading-snug min-h-[2.5em]">
                                                {recipe.description}
                                            </p>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-2 space-y-3">
                                            <div>
                                                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                                    Ingredientes
                                                </p>
                                                <ul className="list-disc pl-5 space-y-1">
                                                    {recipe.ingredients.map((ing, i) => (
                                                        <li key={i} className="text-sm text-zinc-600 dark:text-zinc-400">
                                                            {ing}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="pt-1">
                                                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                                                    Preparación
                                                </p>
                                                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                                    {recipe.process}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
}
