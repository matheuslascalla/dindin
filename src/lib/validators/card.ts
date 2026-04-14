import { z } from 'zod';

export const CreateCardSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  brand: z.string().optional(),
});

export const UpdateCardSchema = CreateCardSchema.partial();

export const CreateCardExpenseSchema = z
  .object({
    cardId: z.string().min(1, 'Cartão é obrigatório'),
    name: z.string().min(1, 'Nome é obrigatório').max(100),
    date: z.coerce.date(),
    description: z.string().optional(),
    person: z.string().optional(),
    value: z.number().positive('Valor deve ser maior que zero'),
    expenseTypeId: z.string().min(1, 'Categoria é obrigatória'),
    kind: z.enum(['none', 'monthly', 'installment']).default('none'),
    installmentCount: z.number().int().min(2).max(60).optional(),
  })
  .refine((data) => data.kind !== 'installment' || (data.installmentCount ?? 0) >= 2, {
    message: 'Número de parcelas deve ser pelo menos 2.',
    path: ['installmentCount'],
  });

export const UpdateCardExpenseSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  date: z.coerce.date().optional(),
  description: z.string().optional(),
  person: z.string().optional(),
  value: z.number().positive().optional(),
  expenseTypeId: z.string().min(1).optional(),
});

export type CreateCardInput = z.infer<typeof CreateCardSchema>;
export type UpdateCardInput = z.infer<typeof UpdateCardSchema>;
export type CreateCardExpenseInput = z.infer<typeof CreateCardExpenseSchema>;
export type UpdateCardExpenseInput = z.infer<typeof UpdateCardExpenseSchema>;
