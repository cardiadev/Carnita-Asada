import { z } from 'zod'

export const createShoppingItemSchema = z.object({
  eventId: z.string().uuid('ID de evento inválido'),
  categoryId: z.string().uuid('ID de categoría inválido').optional(),
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre es muy largo'),
  quantity: z.number().positive('La cantidad debe ser positiva').default(1),
  unit: z.string().max(20).default('piezas'),
})

export const updateShoppingItemSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre es muy largo')
    .optional(),
  quantity: z.number().positive('La cantidad debe ser positiva').optional(),
  unit: z.string().max(20).optional(),
  isPurchased: z.boolean().optional(),
})

export type CreateShoppingItemInput = z.infer<typeof createShoppingItemSchema>
export type UpdateShoppingItemInput = z.infer<typeof updateShoppingItemSchema>
