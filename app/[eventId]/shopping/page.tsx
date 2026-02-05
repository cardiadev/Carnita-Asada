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
import { Pencil, Trash2, Check } from 'lucide-react'
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

export default function ShoppingPage({ params }: ShoppingPageProps) {
  const { eventId } = use(params)
  const [items, setItems] = useState<ShoppingItemWithCategory[]>([])
  const [categories, setCategories] = useState<CategoryWithSuggestions[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [eventUuid, setEventUuid] = useState<string | null>(null)

  // Form state
  const [newItemName, setNewItemName] = useState('')
  const [newItemQuantity, setNewItemQuantity] = useState('1')
  const [newItemUnit, setNewItemUnit] = useState('piezas')
  const [newItemCategory, setNewItemCategory] = useState<string>('')
  const [isAdding, setIsAdding] = useState(false)

  // Edit state
  const [editingItem, setEditingItem] = useState<ShoppingItemWithCategory | null>(null)
  const [editName, setEditName] = useState('')
  const [editQuantity, setEditQuantity] = useState('')
  const [editUnit, setEditUnit] = useState('')
  const [isEditSaving, setIsEditSaving] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener evento
        const eventRes = await fetch(`/api/events/${eventId}`)
        const eventData = await eventRes.json()
        if (eventRes.ok) setEventUuid(eventData.id)

        // Obtener categorías
        const catRes = await fetch('/api/categories')
        const catData = await catRes.json()
        if (catRes.ok) setCategories(catData)

        // Obtener items
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

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newItemName.trim()) {
      toast.error('Por favor ingresa un nombre')
      return
    }

    if (!eventUuid) {
      toast.error('Error: no se pudo obtener el ID del evento')
      return
    }

    setIsAdding(true)

    try {
      const res = await fetch('/api/shopping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: eventUuid,
          categoryId: newItemCategory || undefined,
          name: newItemName.trim(),
          quantity: parseFloat(newItemQuantity) || 1,
          unit: newItemUnit,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al agregar item')
      }

      setItems([...items, data])
      setNewItemName('')
      setNewItemQuantity('1')
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
    setEditName(item.name)
    setEditQuantity(String(item.quantity))
    setEditUnit(item.unit)
  }

  const handleSaveEdit = async () => {
    if (!editingItem || !editName.trim()) return

    setIsEditSaving(true)
    try {
      const res = await fetch(`/api/shopping/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          quantity: parseFloat(editQuantity) || 1,
          unit: editUnit,
        }),
      })

      if (!res.ok) throw new Error()

      setItems(items.map(i =>
        i.id === editingItem.id
          ? { ...i, name: editName.trim(), quantity: parseFloat(editQuantity) || 1, unit: editUnit }
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
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Lista de Compras
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {purchasedCount} de {items.length} comprados
          </p>
        </div>

        <div className="flex gap-2">
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
              <Button variant="outline" size="sm">
                💡 Sugerencias
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md">
              <SheetHeader className="mb-4">
                <SheetTitle>Sugerencias</SheetTitle>
                <SheetDescription>
                  Agrega items rápidamente tocando los botones
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-160px)] pr-2">
                {categories.map((category, index) => (
                  <div key={category.id}>
                    {index > 0 && <Separator className="mb-4" />}
                    <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100 mb-3">
                      {category.name}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {category.suggested_items?.map((suggestion) => (
                        <Button
                          key={suggestion.id}
                          variant="secondary"
                          size="sm"
                          onClick={() => handleAddSuggestion(suggestion)}
                          className="text-sm hover:bg-orange-100 dark:hover:bg-orange-900/30 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
                        >
                          + {suggestion.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Formulario agregar */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <form onSubmit={handleAddItem} className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Nombre del item"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                disabled={isAdding}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="Cantidad"
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(e.target.value)}
                disabled={isAdding}
                className="w-20"
                min="0.1"
                step="0.1"
              />
            </div>
            <div className="flex gap-2">
              <Select value={newItemCategory} onValueChange={setNewItemCategory}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Categoría (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={newItemUnit} onValueChange={setNewItemUnit}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
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
            </div>
            <Button
              type="submit"
              disabled={isAdding}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {isAdding ? 'Agregando...' : 'Agregar Item'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista de items */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-zinc-500 dark:text-zinc-400">
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
              <Card key={category.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {categoryItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-2 border-b last:border-0 dark:border-zinc-700"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleTogglePurchased(item)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${item.is_purchased
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
                        <span className={item.is_purchased ? 'line-through text-zinc-400' : ''}>
                          {item.name}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {item.quantity} {item.unit}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(item)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.id)}
                          className="text-red-500 hover:text-red-600"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}

          {/* Items sin categoría */}
          {itemsByCategory['sin-categoria']?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Otros</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {itemsByCategory['sin-categoria'].map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 border-b last:border-0 dark:border-zinc-700"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleTogglePurchased(item)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${item.is_purchased
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-zinc-300 dark:border-zinc-600'
                          }`}
                      >
                        {item.is_purchased && <Check className="h-3.5 w-3.5" />}
                      </button>
                      <span className={item.is_purchased ? 'line-through text-zinc-400' : ''}>
                        {item.name}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {item.quantity} {item.unit}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(item)}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id)}
                        className="text-red-500 hover:text-red-600"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
          <DialogHeader>
            <DialogTitle>Editar item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Nombre</Label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={isEditSaving}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editQuantity">Cantidad</Label>
                <Input
                  id="editQuantity"
                  type="number"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                  disabled={isEditSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editUnit">Unidad</Label>
                <Select value={editUnit} onValueChange={setEditUnit} disabled={isEditSaving}>
                  <SelectTrigger id="editUnit">
                    <SelectValue />
                  </SelectTrigger>
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
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={isEditSaving} className="bg-orange-600 hover:bg-orange-700">
              {isEditSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
