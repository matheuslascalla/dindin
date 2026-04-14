import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/** Início do mês em UTC (evita deslocamento de timezone no banco) */
export function utcStartOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

/** Fim do mês em UTC */
export function utcEndOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999));
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(date));
}

export const RECURRENCE_LABEL: Record<string, string> = {
  monthly: 'Mensal',
  weekly: 'Semanal',
  eventual: 'Eventual',
};

/** Converts a Date (or today) to the yyyy-MM-dd string required by <input type="date"> */
export function toDateInputValue(date: Date | string = new Date()): string {
  return new Date(date).toISOString().split('T')[0];
}

/** Prisma filter for CardExpense: one-off/installments in the given range + all monthly recurrences */
export function cardExpenseMonthFilter(start: Date, end: Date) {
  return {
    OR: [
      { recurrence: 'none' as const, date: { gte: start, lte: end } },
      { recurrence: 'monthly' as const },
    ],
  };
}
