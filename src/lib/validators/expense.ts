import { z } from 'zod';

import { safeDate } from './shared';

export const CreateExpenseSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  value: z.number().positive('Valor deve ser maior que zero'),
  date: safeDate,
  description: z.string().max(500).optional(),
  person: z.string().max(100).optional(),
  paymentMethod: z.enum(['PIX', 'MONEY']).default('PIX'),
  expenseTypeId: z.string().min(1, 'Categoria é obrigatória'),
  subcategoryId: z.string().optional(),
});

export const UpdateExpenseSchema = CreateExpenseSchema.partial();

export const ExpenseFiltersSchema = z.object({
  month: safeDate.optional(),
  expenseTypeId: z.string().optional(),
  person: z.string().optional(),
});

export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof UpdateExpenseSchema>;
export type ExpenseFilters = z.infer<typeof ExpenseFiltersSchema>;
