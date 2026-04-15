import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ContextPersons } from '@/server/actions/house';
import {
  Home,
  Target,
  Sofa,
  Heart,
  TrendingUp,
  BookOpen,
  ShoppingBag,
  Car,
  Utensils,
  Plane,
  Activity,
  Music,
  Coffee,
  Film,
  Globe,
  Star,
  Zap,
  Gift,
  Shield,
  Sun,
  Tag,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  home: Home,
  target: Target,
  sofa: Sofa,
  heart: Heart,
  'trending-up': TrendingUp,
  'book-open': BookOpen,
  'shopping-bag': ShoppingBag,
  car: Car,
  utensils: Utensils,
  plane: Plane,
  activity: Activity,
  music: Music,
  coffee: Coffee,
  film: Film,
  globe: Globe,
  star: Star,
  zap: Zap,
  gift: Gift,
  shield: Shield,
  sun: Sun,
};

export function getCategoryIcon(iconName: string): LucideIcon {
  return ICON_MAP[iconName] ?? Tag;
}

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

export function resolvePersonFromContext(
  contextPersons: ContextPersons,
  formPerson: string
): string | undefined {
  return contextPersons.type === 'personal'
    ? (contextPersons.user.name ?? undefined)
    : formPerson || undefined;
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
