import { z } from 'zod'

export const createEventSchema = z.object({
  title: z
    .string()
    .min(1, 'El título es requerido')
    .max(255, 'El título es muy largo'),
  eventDate: z
    .string()
    .min(1, 'La fecha es requerida')
    .refine((date) => new Date(date) > new Date(), {
      message: 'La fecha debe ser en el futuro',
    }),
  location: z.string().max(255).optional().nullable(),
})

export const updateEventSchema = z.object({
  title: z
    .string()
    .min(1, 'El título es requerido')
    .max(255, 'El título es muy largo')
    .optional(),
  eventDate: z.string().optional(),
  peopleCount: z.number().int().min(0).optional(),
  location: z.string().max(255).optional().nullable(),
})

export type CreateEventInput = z.infer<typeof createEventSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
