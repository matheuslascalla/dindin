import { z } from 'zod';

export const CreateExpenseSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  value: z.number().positive('Valor deve ser maior que zero'),
  date: z.coerce.date(),
  description: z.string().optional(),
  person: z.string().optional(),
  expenseTypeId: z.string().min(1, 'Categoria é obrigatória'),
});

export const UpdateExpenseSchema = CreateExpenseSchema.partial();

export const ExpenseFiltersSchema = z.object({
  month: z.coerce.date().optional(),
  expenseTypeId: z.string().optional(),
  person: z.string().optional(),
});

export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof UpdateExpenseSchema>;
export type ExpenseFilters = z.infer<typeof ExpenseFiltersSchema>;
