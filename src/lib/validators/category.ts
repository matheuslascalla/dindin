import { z } from 'zod';

export const CreateCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  limitPercent: z
    .number()
    .min(0.1, 'Limite deve ser maior que 0')
    .max(100, 'Limite não pode exceder 100%'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser um hex válido (ex: #6B7280)'),
  icon: z.string().min(1, 'Ícone é obrigatório'),
});

export const UpdateCategorySchema = CreateCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
