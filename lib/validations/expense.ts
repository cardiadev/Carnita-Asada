import { z } from 'zod'

export const createExpenseSchema = z.object({
  eventId: z.string().uuid('ID de evento inválido'),
  attendeeId: z.string().uuid('ID de asistente inválido').optional(),
  description: z
    .string()
    .min(1, 'La descripción es requerida')
    .max(255, 'La descripción es muy larga'),
  amount: z.number().positive('El monto debe ser positivo'),
  receiptUrl: z.string().url().optional(),
  excludedAttendees: z.array(z.string().uuid()).optional(),
})

export const updateExpenseSchema = z.object({
  attendeeId: z.string().uuid('ID de asistente inválido').optional(),
  description: z
    .string()
    .min(1, 'La descripción es requerida')
    .max(255, 'La descripción es muy larga')
    .optional(),
  amount: z.number().positive('El monto debe ser positivo').optional(),
  receiptUrl: z.string().url().nullable().optional(),
  excludedAttendees: z.array(z.string().uuid()).optional(),
})

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>
