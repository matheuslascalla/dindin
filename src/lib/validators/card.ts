import { z } from 'zod';

import { safeDate } from './shared';

export const CreateCardSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  brand: z.string().max(50).optional(),
});

export const UpdateCardSchema = CreateCardSchema.partial();

export const CreateCardExpenseSchema = z
  .object({
    cardId: z.string().min(1, 'Cartão é obrigatório'),
    name: z.string().min(1, 'Nome é obrigatório').max(100),
    date: safeDate,
    description: z.string().max(500).optional(),
    person: z.string().max(100).optional(),
    value: z.number().positive('Valor deve ser maior que zero'),
    expenseTypeId: z.string().min(1, 'Categoria é obrigatória'),
    subcategoryId: z.string().optional(),
    kind: z.enum(['none', 'monthly', 'installment']).default('none'),
    installmentCount: z.number().int().min(2).max(60).optional(),
  })
  .refine((data) => data.kind !== 'installment' || (data.installmentCount ?? 0) >= 2, {
    message: 'Número de parcelas deve ser pelo menos 2.',
    path: ['installmentCount'],
  });

export const UpdateCardExpenseSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  date: safeDate.optional(),
  description: z.string().max(500).optional(),
  person: z.string().max(100).optional(),
  value: z.number().positive().optional(),
  expenseTypeId: z.string().min(1).optional(),
  subcategoryId: z.string().optional(),
});

export type CreateCardInput = z.infer<typeof CreateCardSchema>;
export type UpdateCardInput = z.infer<typeof UpdateCardSchema>;
export type CreateCardExpenseInput = z.infer<typeof CreateCardExpenseSchema>;
export type UpdateCardExpenseInput = z.infer<typeof UpdateCardExpenseSchema>;
