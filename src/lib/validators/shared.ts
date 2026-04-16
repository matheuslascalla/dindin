import { z } from 'zod';

export const safeDate = z.coerce
  .date()
  .refine((d) => !Number.isNaN(d.getTime()), { message: 'Data inválida' });
