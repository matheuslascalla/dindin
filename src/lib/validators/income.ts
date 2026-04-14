import { z } from 'zod';

export const RecurrenceEnum = z.enum(['monthly', 'weekly', 'eventual']);

export const CreateIncomeSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  value: z.number().positive('Valor deve ser maior que zero'),
  recurrence: RecurrenceEnum,
  startDate: z.coerce.date(),
  active: z.boolean().default(true),
});

export const UpdateIncomeSchema = CreateIncomeSchema.partial();

export const IncomeFiltersSchema = z.object({
  active: z.boolean().optional(),
  recurrence: RecurrenceEnum.optional(),
});

export type CreateIncomeInput = z.infer<typeof CreateIncomeSchema>;
export type UpdateIncomeInput = z.infer<typeof UpdateIncomeSchema>;
export type IncomeFilters = z.infer<typeof IncomeFiltersSchema>;
