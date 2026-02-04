import { z } from 'zod'

export const createAttendeeSchema = z.object({
  eventId: z.string().uuid('ID de evento inválido'),
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre es muy largo'),
})

export const updateAttendeeSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre es muy largo')
    .optional(),
  excludeFromSplit: z.boolean().optional(),
})

export type CreateAttendeeInput = z.infer<typeof createAttendeeSchema>
export type UpdateAttendeeInput = z.infer<typeof updateAttendeeSchema>
