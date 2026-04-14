'use server';

import { subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { prisma } from '@/lib/prisma';
import { getContextFilter } from '@/lib/context';
import { utcStartOfMonth, utcEndOfMonth, cardExpenseMonthFilter } from '@/lib/utils';

// Counts how many times the weekly occurrence day falls within [effectiveStart, monthEnd]
function countWeeklyOccurrences(startDate: Date, monthStart: Date, monthEnd: Date): number {
  const effectiveStart = startDate > monthStart ? startDate : monthStart;
  if (effectiveStart > monthEnd) return 0;

  const targetDay = startDate.getDay();
  let cur = new Date(effectiveStart);

  while (cur.getDay() !== targetDay) {
    cur = new Date(cur.getTime() + 86_400_000);
  }

  let count = 0;
  while (cur <= monthEnd) {
    count += 1;
    cur = new Date(cur.getTime() + 7 * 86_400_000);
  }

  return count;
}

function sumWeeklyIncome(
  incomes: { value: number; startDate: Date }[],
  start: Date,
  end: Date
): number {
  return incomes.reduce(
    (sum, inc) => sum + inc.value * countWeeklyOccurrences(new Date(inc.startDate), start, end),
    0
  );
}

export interface DashboardSummary {
  monthlyIncome: number;
  eventualIncome: number;
  weeklyIncome: number;
  totalExpenses: number;
  balance: number;
  biggestExpense: { name: string; value: number } | null;
}

export interface CategoryBreakdown {
  id: string;
  name: string;
  color: string;
  limitPercent: number;
  totalValue: number;
  percentOfIncome: number;
  status: 'ok' | 'warning' | 'danger';
}

export interface MonthlyHistory {
  month: string;
  income: number;
  expenses: number;
}

export interface TopExpense {
  name: string;
  value: number;
  categoryName: string;
  categoryColor: string;
  person?: string;
  source: 'expense' | 'card';
  cardName?: string;
}

export interface PersonBreakdown {
  person: string;
  totalValue: number;
}

export interface CardSummary {
  cardId: string;
  cardName: string;
  totalValue: number;
  expenseCount: number;
}

export interface CategoryAlert {
  id: string;
  name: string;
  color: string;
  limitPercent: number;
  currentPercent: number;
  status: 'warning' | 'danger';
}

export async function getDashboardSummary(month: Date): Promise<DashboardSummary> {
  const filter = await getContextFilter();
  const start = utcStartOfMonth(month);
  const end = utcEndOfMonth(month);
  const cardFilter = cardExpenseMonthFilter(start, end);

  const [monthlyIncomeAgg, eventualIncomeAgg, weeklyIncomes, expenses, cardExpenses] =
    await Promise.all([
      prisma.income.aggregate({
        _sum: { value: true },
        where: { ...filter, active: true, recurrence: 'monthly', startDate: { lte: end } },
      }),
      prisma.income.aggregate({
        _sum: { value: true },
        where: {
          ...filter,
          active: true,
          recurrence: 'eventual',
          startDate: { gte: start, lte: end },
        },
      }),
      prisma.income.findMany({
        where: { ...filter, active: true, recurrence: 'weekly', startDate: { lte: end } },
        select: { value: true, startDate: true },
      }),
      prisma.expense.findMany({
        where: { ...filter, date: { gte: start, lte: end } },
        select: { name: true, value: true },
      }),
      prisma.cardExpense.findMany({
        where: { card: filter, ...cardFilter },
        select: { name: true, value: true },
      }),
    ]);

  const monthlyIncome = monthlyIncomeAgg._sum.value ?? 0;
  const eventualIncome = eventualIncomeAgg._sum.value ?? 0;
  const weeklyIncome = sumWeeklyIncome(weeklyIncomes, start, end);

  const allExpenses = [...expenses, ...cardExpenses];
  const { biggest, totalExpenses } = allExpenses.reduce<{
    biggest: { name: string; value: number } | null;
    totalExpenses: number;
  }>(
    (acc, e) => ({
      biggest: !acc.biggest || e.value > acc.biggest.value ? e : acc.biggest,
      totalExpenses: acc.totalExpenses + e.value,
    }),
    { biggest: null, totalExpenses: 0 }
  );

  return {
    monthlyIncome,
    eventualIncome,
    weeklyIncome,
    totalExpenses,
    balance: monthlyIncome + eventualIncome + weeklyIncome - totalExpenses,
    biggestExpense: biggest,
  };
}

export async function getExpensesByCategory(month: Date): Promise<CategoryBreakdown[]> {
  const filter = await getContextFilter();
  const start = utcStartOfMonth(month);
  const end = utcEndOfMonth(month);
  const cardFilter = cardExpenseMonthFilter(start, end);

  const [categories, monthlyIncomeAgg, eventualIncomeAgg, weeklyIncomes] = await Promise.all([
    prisma.expenseType.findMany({
      where: filter,
      include: {
        expenses: { where: { date: { gte: start, lte: end } } },
        cardExpenses: { where: { card: filter, ...cardFilter } },
      },
    }),
    prisma.income.aggregate({
      _sum: { value: true },
      where: { ...filter, active: true, recurrence: 'monthly', startDate: { lte: end } },
    }),
    prisma.income.aggregate({
      _sum: { value: true },
      where: {
        ...filter,
        active: true,
        recurrence: 'eventual',
        startDate: { gte: start, lte: end },
      },
    }),
    prisma.income.findMany({
      where: { ...filter, active: true, recurrence: 'weekly', startDate: { lte: end } },
      select: { value: true, startDate: true },
    }),
  ]);

  const monthlyIncome = monthlyIncomeAgg._sum.value ?? 0;
  const eventualIncome = eventualIncomeAgg._sum.value ?? 0;
  const weeklyIncome = sumWeeklyIncome(weeklyIncomes, start, end);
  const totalIncome = monthlyIncome + eventualIncome + weeklyIncome;

  return categories.map((cat) => {
    const totalValue =
      cat.expenses.reduce((s, e) => s + e.value, 0) +
      cat.cardExpenses.reduce((s, e) => s + e.value, 0);
    const percentOfIncome = totalIncome > 0 ? (totalValue / totalIncome) * 100 : 0;
    const percentOfLimit = cat.limitPercent > 0 ? (percentOfIncome / cat.limitPercent) * 100 : 0;

    return {
      id: cat.id,
      name: cat.name,
      color: cat.color,
      limitPercent: cat.limitPercent,
      totalValue,
      percentOfIncome,
      status: percentOfLimit >= 100 ? 'danger' : percentOfLimit >= 80 ? 'warning' : 'ok',
    };
  });
}

export async function getMonthlyHistory(months: number = 6): Promise<MonthlyHistory[]> {
  const filter = await getContextFilter();
  const now = new Date();
  const dates = Array.from({ length: months }, (_, i) => subMonths(now, months - 1 - i));

  const monthlyData = await Promise.all(
    dates.map((date) => {
      const start = utcStartOfMonth(date);
      const end = utcEndOfMonth(date);

      return Promise.all([
        prisma.income.aggregate({
          _sum: { value: true },
          where: { ...filter, active: true, recurrence: 'monthly', startDate: { lte: end } },
        }),
        prisma.income.aggregate({
          _sum: { value: true },
          where: {
            ...filter,
            active: true,
            recurrence: 'eventual',
            startDate: { gte: start, lte: end },
          },
        }),
        prisma.income.findMany({
          where: { ...filter, active: true, recurrence: 'weekly', startDate: { lte: end } },
          select: { value: true, startDate: true },
        }),
        prisma.expense.aggregate({
          _sum: { value: true },
          where: { ...filter, date: { gte: start, lte: end } },
        }),
        prisma.cardExpense.aggregate({
          _sum: { value: true },
          where: { card: filter, ...cardExpenseMonthFilter(start, end) },
        }),
      ]);
    })
  );

  return dates.map((date, i) => {
    const start = utcStartOfMonth(date);
    const end = utcEndOfMonth(date);
    const [monthlyAgg, eventualAgg, weeklyIncomes, expensesAgg, cardAgg] = monthlyData[i];

    const monthlyIncome = monthlyAgg._sum.value ?? 0;
    const eventualIncome = eventualAgg._sum.value ?? 0;
    const weeklyIncome = weeklyIncomes.reduce(
      (sum, inc) => sum + inc.value * countWeeklyOccurrences(new Date(inc.startDate), start, end),
      0
    );

    return {
      month: format(date, 'MMM', { locale: ptBR }),
      income: monthlyIncome + eventualIncome + weeklyIncome,
      expenses: (expensesAgg._sum.value ?? 0) + (cardAgg._sum.value ?? 0),
    };
  });
}

export async function getTopExpenses(month: Date, limit: number = 5): Promise<TopExpense[]> {
  const filter = await getContextFilter();
  const start = utcStartOfMonth(month);
  const end = utcEndOfMonth(month);

  // Fetch top `limit` from each source — after merging both, the true top `limit` are always present.
  const [expenses, cardExpenses] = await Promise.all([
    prisma.expense.findMany({
      where: { ...filter, date: { gte: start, lte: end } },
      include: { expenseType: true },
      orderBy: { value: 'desc' },
      take: limit,
    }),
    prisma.cardExpense.findMany({
      where: { card: filter, ...cardExpenseMonthFilter(start, end) },
      include: { expenseType: true, card: true },
      orderBy: { value: 'desc' },
      take: limit,
    }),
  ]);

  const all: TopExpense[] = [
    ...expenses.map((e) => ({
      name: e.name,
      value: e.value,
      categoryName: e.expenseType.name,
      categoryColor: e.expenseType.color,
      person: e.person ?? undefined,
      source: 'expense' as const,
    })),
    ...cardExpenses.map((e) => ({
      name: e.name,
      value: e.value,
      categoryName: e.expenseType.name,
      categoryColor: e.expenseType.color,
      person: e.person ?? undefined,
      source: 'card' as const,
      cardName: e.card.name,
    })),
  ];

  return all.sort((a, b) => b.value - a.value).slice(0, limit);
}

export async function getExpensesByPerson(month: Date): Promise<PersonBreakdown[]> {
  const filter = await getContextFilter();
  const start = utcStartOfMonth(month);
  const end = utcEndOfMonth(month);

  const [expenses, cardExpenses] = await Promise.all([
    prisma.expense.findMany({
      where: { ...filter, date: { gte: start, lte: end }, person: { not: null } },
      select: { person: true, value: true },
    }),
    prisma.cardExpense.findMany({
      where: { card: filter, ...cardExpenseMonthFilter(start, end), person: { not: null } },
      select: { person: true, value: true },
    }),
  ]);

  const map = new Map<string, number>();
  for (const e of [...expenses, ...cardExpenses]) {
    if (e.person) map.set(e.person, (map.get(e.person) ?? 0) + e.value);
  }

  return Array.from(map.entries())
    .map(([person, totalValue]) => ({ person, totalValue }))
    .sort((a, b) => b.totalValue - a.totalValue);
}

export async function getCardSummary(month: Date): Promise<CardSummary[]> {
  const filter = await getContextFilter();
  const start = utcStartOfMonth(month);
  const end = utcEndOfMonth(month);

  const cards = await prisma.creditCard.findMany({
    where: filter,
    include: {
      expenses: { where: cardExpenseMonthFilter(start, end) },
    },
  });

  return cards.map((card) => ({
    cardId: card.id,
    cardName: card.name,
    totalValue: card.expenses.reduce((s, e) => s + e.value, 0),
    expenseCount: card.expenses.length,
  }));
}

export async function getCategoryAlerts(month: Date): Promise<CategoryAlert[]> {
  const breakdown = await getExpensesByCategory(month);
  return breakdown
    .filter((b) => b.status !== 'ok')
    .map((b) => ({
      id: b.id,
      name: b.name,
      color: b.color,
      limitPercent: b.limitPercent,
      currentPercent: b.percentOfIncome,
      status: b.status as 'warning' | 'danger',
    }));
}
