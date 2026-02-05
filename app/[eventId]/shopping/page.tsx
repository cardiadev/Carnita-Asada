'use client'

import { useState, useEffect, use } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Pencil, Trash2, Check, Lightbulb } from 'lucide-react'
import { TemplateSelector } from '@/components/shopping/template-selector'
import type { ShoppingItem, Category, SuggestedItem } from '@/types/database'

interface ShoppingPageProps {
  params: Promise<{ eventId: string }>
}

type ShoppingItemWithCategory = ShoppingItem & {
  category: Category | null
}

type CategoryWithSuggestions = Category & {
  suggested_items: SuggestedItem[]
}

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const formSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  quantity: z.string().min(1, 'La cantidad es requerida'),
  unit: z.string().min(1, 'La unidad es requerida'),
  categoryId: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function ShoppingPage({ params }: ShoppingPageProps) {
  const { eventId } = use(params)
  const [items, setItems] = useState<ShoppingItemWithCategory[]>([])
  const [categories, setCategories] = useState<CategoryWithSuggestions[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [eventUuid, setEventUuid] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [editingItem, setEditingItem] = useState<ShoppingItemWithCategory | null>(null)
  const [isEditSaving, setIsEditSaving] = useState(false)

  // Add Item Form
  const addForm = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      quantity: '1',
      unit: 'piezas',
      categoryId: '',
    },
  })

  // Edit Item Form
  const editForm = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      quantity: '1',
      unit: 'piezas',
      categoryId: '',
    },
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventRes = await fetch(`/api/events/${eventId}`)
        const eventData = await eventRes.json()
        if (eventRes.ok) setEventUuid(eventData.id)

        const catRes = await fetch('/api/categories')
        const catData = await catRes.json()
        if (catRes.ok) setCategories(catData)

        const itemsRes = await fetch(`/api/shopping?eventId=${eventId}`)
        const itemsData = await itemsRes.json()
        if (itemsRes.ok) setItems(itemsData)
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Error al cargar los datos')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [eventId])

  const onAddItem = async (values: FormValues) => {
    if (!eventUuid) {
      toast.error('Error: no se pudo obtener el ID del evento')
      return
    }

    setIsAdding(true)

    try {
      const categoryId = values.categoryId === 'none' ? undefined : values.categoryId

      const res = await fetch('/api/shopping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: eventUuid,
          categoryId: categoryId,
          name: values.name.trim(),
          quantity: parseFloat(values.quantity) || 1,
          unit: values.unit,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al agregar item')
      }

      setItems([...items, data])
      addForm.reset({
        name: '',
        quantity: '1',
        unit: 'piezas',
        categoryId: 'none',
      })
      toast.success('Item agregado')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al agregar item')
    } finally {
      setIsAdding(false)
    }
  }

  const handleAddSuggestion = async (suggestion: SuggestedItem) => {
    if (!eventUuid) return

    try {
      const res = await fetch('/api/shopping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: eventUuid,
          categoryId: suggestion.category_id,
          name: suggestion.name,
          quantity: 1,
          unit: suggestion.default_unit,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error)
      }

      setItems([...items, data])
      toast.success(`${suggestion.name} agregado`)
    } catch {
      toast.error('Error al agregar item')
    }
  }

  const handleTogglePurchased = async (item: ShoppingItemWithCategory) => {
    try {
      const res = await fetch(`/api/shopping/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPurchased: !item.is_purchased }),
      })

      if (!res.ok) throw new Error()

      setItems(items.map(i =>
        i.id === item.id ? { ...i, is_purchased: !i.is_purchased } : i
      ))
    } catch {
      toast.error('Error al actualizar')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/shopping/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setItems(items.filter(i => i.id !== id))
      toast.success('Item eliminado')
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const handleEditClick = (item: ShoppingItemWithCategory) => {
    setEditingItem(item)
    editForm.reset({
      name: item.name,
      quantity: String(item.quantity),
      unit: item.unit,
      categoryId: item.category_id || 'none',
    })
  }

  const onEditItem = async (values: FormValues) => {
    if (!editingItem) return

    setIsEditSaving(true)
    try {
      const categoryId = values.categoryId === 'none' ? null : values.categoryId

      const res = await fetch(`/api/shopping/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name.trim(),
          quantity: parseFloat(values.quantity) || 1,
          unit: values.unit,
          categoryId: categoryId,
        }),
      })

      if (!res.ok) throw new Error()

      const newCategory = categories.find(c => c.id === categoryId) || null

      setItems(items.map(i =>
        i.id === editingItem.id
          ? {
            ...i,
            name: values.name.trim(),
            quantity: parseFloat(values.quantity) || 1,
            unit: values.unit,
            category_id: categoryId ?? null,
            category: newCategory
          }
          : i
      ))
      setEditingItem(null)
      toast.success('Item actualizado')
    } catch {
      toast.error('Error al actualizar')
    } finally {
      setIsEditSaving(false)
    }
  }

  // Agrupar items por categoría
  const itemsByCategory = items.reduce((acc, item) => {
    const categoryId = item.category_id || 'sin-categoria'
    if (!acc[categoryId]) acc[categoryId] = []
    acc[categoryId].push(item)
    return acc
  }, {} as Record<string, ShoppingItemWithCategory[]>)

  const purchasedCount = items.filter(i => i.is_purchased).length

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Header: Stack on mobile */}
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Lista de Compras
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {purchasedCount} de {items.length} comprados
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-2">
          <TemplateSelector
            eventUuid={eventUuid}
            onItemsAdded={() => {
              // Refetch items
              fetch(`/api/shopping?eventId=${eventId}`)
                .then(res => res.json())
                .then(data => setItems(data))
            }}
            categories={categories.map(c => ({ id: c.id, name: c.name }))}
          />

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto">
                <Lightbulb className="h-4 w-4 mr-2" />
                Sugerencias
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
              <SheetHeader className="p-6 pb-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
                <SheetTitle>Sugerencias</SheetTitle>
                <SheetDescription>
                  Agrega items rápidamente tocando los botones
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto p-6 pt-4">
                <div className="space-y-6">
                  {categories.map((category, index) => (
                    <div key={category.id} className="mb-6 last:mb-0">
                      <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        {category.name}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {category.suggested_items?.map((suggestion) => (
                          <Button
                            key={suggestion.id}
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddSuggestion(suggestion)}
                            className="text-sm bg-white dark:bg-zinc-800/50 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 dark:hover:text-orange-400 hover:border-orange-200 dark:hover:border-orange-800 border-zinc-200 dark:border-zinc-700 transition-all rounded-full px-4"
                          >
                            + {suggestion.name}
                          </Button>
                        ))}
                      </div>
                      {index < categories.length - 1 && (
                        <Separator className="mt-8 opacity-50" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Formulario agregar */}
      <Card className="mb-6 overflow-hidden">
        <CardContent className="p-4">
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddItem)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="¿Qué falta? (ej. Arrachera, Carbón...)"
                        disabled={isAdding}
                        className="w-full"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-2">
                <FormField
                  control={addForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem className="col-span-1">
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Cant."
                          disabled={isAdding}
                          min="0.1"
                          step="0.1"
                          className="w-full"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem className="col-span-1">
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="piezas">piezas</SelectItem>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="litros">litros</SelectItem>
                          <SelectItem value="paquetes">paquetes</SelectItem>
                          <SelectItem value="bolsas">bolsas</SelectItem>
                          <SelectItem value="manojos">manojos</SelectItem>
                          <SelectItem value="six">six</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem className="xs:col-span-2 sm:col-span-2">
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Categoría (opcional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button
                type="submit"
                variant="outline"
                disabled={isAdding}
                className="w-full bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 font-bold text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-all font-bold"
              >
                {isAdding ? 'Agregando...' : 'Agregar Item'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Lista de items */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-zinc-500 dark:text-zinc-400">
            <p>No hay items en la lista</p>
            <p className="text-sm mt-1">Agrega items o usa las sugerencias</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => {
            const categoryItems = itemsByCategory[category.id]
            if (!categoryItems?.length) return null

            return (
              <Card key={category.id} className="overflow-hidden">
                <CardHeader className="p-4 pb-2 border-b border-zinc-50 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800/20">
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  {categoryItems.map((item) => (
                    <div
                      key={item.id}
                      className={`py-3 px-4 -mx-4 border-b last:border-0 dark:border-zinc-700 transition-colors ${item.is_purchased ? 'bg-green-50 dark:bg-green-900/20' : ''}`}
                    >
                      {/* Mobile: Stack layout */}
                      <div className="flex flex-col gap-2">
                        {/* Row 1: Checkbox + Name */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleTogglePurchased(item)}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${item.is_purchased
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-zinc-300 dark:border-zinc-600'
                              }`}
                          >
                            {item.is_purchased && (
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </button>
                          <span className={`flex-1 ${item.is_purchased ? 'line-through text-zinc-400' : ''}`}>
                            {item.name}
                          </span>
                        </div>
                        {/* Row 2: Quantity */}
                        <div className="pl-9">
                          <Badge variant="secondary" className="text-xs">
                            {item.quantity} {item.unit}
                          </Badge>
                        </div>
                        {/* Row 3: Actions (no top border) */}
                        <div className="flex items-center justify-between gap-2 -mx-2 px-2">
                          <Button
                            variant="ghost"
                            onClick={() => handleEditClick(item)}
                            title="Editar"
                            className="flex-1 h-10 gap-2"
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="text-sm">Editar</span>
                          </Button>
                          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700" />
                          <Button
                            variant="ghost"
                            onClick={() => handleDelete(item.id)}
                            className="flex-1 h-10 gap-2 text-red-500 hover:text-red-600"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="text-sm">Borrar</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}

          {/* Items sin categoría */}
          {itemsByCategory['sin-categoria']?.length > 0 && (
            <Card className="overflow-hidden">
              <CardHeader className="p-4 pb-2 border-b border-zinc-50 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800/20">
                <CardTitle className="text-lg">Otros</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {itemsByCategory['sin-categoria'].map((item) => (
                  <div
                    key={item.id}
                    className={`py-3 px-4 -mx-4 border-b last:border-0 dark:border-zinc-700 transition-colors ${item.is_purchased ? 'bg-green-50 dark:bg-green-900/20' : ''}`}
                  >
                    {/* Mobile: Stack layout */}
                    <div className="flex flex-col gap-2">
                      {/* Row 1: Checkbox + Name */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleTogglePurchased(item)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${item.is_purchased
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-zinc-300 dark:border-zinc-600'
                            }`}
                        >
                          {item.is_purchased && <Check className="h-3.5 w-3.5" />}
                        </button>
                        <span className={`flex-1 ${item.is_purchased ? 'line-through text-zinc-400' : ''}`}>
                          {item.name}
                        </span>
                      </div>
                      {/* Row 2: Quantity */}
                      <div className="pl-9">
                        <Badge variant="secondary" className="text-xs">
                          {item.quantity} {item.unit}
                        </Badge>
                      </div>
                      {/* Row 3: Actions (no top border) */}
                      <div className="flex items-center justify-between gap-2 -mx-2 px-2">
                        <Button
                          variant="ghost"
                          onClick={() => handleEditClick(item)}
                          title="Editar"
                          className="flex-1 h-10 gap-2"
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="text-sm">Editar</span>
                        </Button>
                        <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700" />
                        <Button
                          variant="ghost"
                          onClick={() => handleDelete(item.id)}
                          className="flex-1 h-10 gap-2 text-red-500 hover:text-red-600"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="text-sm">Borrar</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditItem)}>
              <DialogHeader>
                <DialogTitle>Editar item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Nombre" disabled={isEditSaving} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-col gap-4">
                  <FormField
                    control={editForm.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cantidad</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            disabled={isEditSaving}
                            step="0.1"
                            placeholder="Cantidad"
                            className="w-full"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidad</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger disabled={isEditSaving} className="w-full">
                              <SelectValue placeholder="Seleccionar unidad" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="piezas">piezas</SelectItem>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="g">g</SelectItem>
                            <SelectItem value="litros">litros</SelectItem>
                            <SelectItem value="paquetes">paquetes</SelectItem>
                            <SelectItem value="bolsas">bolsas</SelectItem>
                            <SelectItem value="manojos">manojos</SelectItem>
                            <SelectItem value="six">six</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoría</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger disabled={isEditSaving} className="w-full">
                              <SelectValue placeholder="Categoría" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Sin categoría</SelectItem>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setEditingItem(null)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="outline"
                  disabled={isEditSaving}
                  className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 font-bold text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-all font-bold"
                >
                  {isEditSaving ? 'Guardando...' : 'Guardar'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
