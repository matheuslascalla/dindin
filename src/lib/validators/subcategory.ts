import { z } from 'zod';

export const CreateSubcategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  expenseTypeId: z.string().min(1, 'Categoria é obrigatória'),
});

export const UpdateSubcategorySchema = CreateSubcategorySchema.partial();

export type CreateSubcategoryInput = z.infer<typeof CreateSubcategorySchema>;
export type UpdateSubcategoryInput = z.infer<typeof UpdateSubcategorySchema>;
