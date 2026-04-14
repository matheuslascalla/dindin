import {
  createExpense,
  updateExpense,
  deleteExpense,
  listExpenses,
  getExpenseTotal,
} from './expense';
import { utcStartOfMonth, utcEndOfMonth } from '@/lib/utils';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    expense: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
  },
}));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('@/lib/context', () => ({
  getContextFilter: jest.fn().mockResolvedValue({ userId: 'user-test', houseId: null }),
}));

const db = prisma.expense as jest.Mocked<typeof prisma.expense>;

beforeEach(() => jest.clearAllMocks());

const validExpense = {
  name: 'Mercado',
  value: 150,
  date: new Date('2024-03-15T00:00:00Z'),
  expenseTypeId: 'type-1',
};

const createdExpense = {
  id: 'exp-1',
  ...validExpense,
  expenseType: { id: 'type-1', name: 'Alimentação', color: '#6B7280' },
  createdAt: new Date(),
};

describe('createExpense', () => {
  it('creates an expense and revalidates /gastos and /dashboard', async () => {
    (db.create as jest.Mock).mockResolvedValue(createdExpense);

    const result = await createExpense(validExpense);

    expect(db.create).toHaveBeenCalledWith({
      data: validExpense,
      include: { expenseType: true },
    });
    expect(revalidatePath).toHaveBeenCalledWith('/gastos');
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
    expect(result).toEqual(createdExpense);
  });
});

describe('updateExpense', () => {
  it('updates expense and revalidates both paths', async () => {
    (db.update as jest.Mock).mockResolvedValue(createdExpense);

    await updateExpense('exp-1', { value: 200 });

    expect(db.update).toHaveBeenCalledWith({
      where: { id: 'exp-1' },
      data: { value: 200 },
      include: { expenseType: true },
    });
    expect(revalidatePath).toHaveBeenCalledWith('/gastos');
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
  });
});

describe('deleteExpense', () => {
  it('deletes expense and revalidates both paths', async () => {
    (db.delete as jest.Mock).mockResolvedValue(createdExpense);

    await deleteExpense('exp-1');

    expect(db.delete).toHaveBeenCalledWith({ where: { id: 'exp-1' } });
    expect(revalidatePath).toHaveBeenCalledWith('/gastos');
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
  });
});

describe('listExpenses', () => {
  it('returns all expenses without date filter when month is not provided', async () => {
    (db.findMany as jest.Mock).mockResolvedValue([createdExpense]);

    const result = await listExpenses();

    expect(db.findMany).toHaveBeenCalledWith({
      where: {},
      include: { expenseType: true },
      orderBy: { date: 'desc' },
    });
    expect(result).toEqual([createdExpense]);
  });

  it('filters by UTC month range when month is provided', async () => {
    const month = new Date('2024-03-01T00:00:00Z');
    (db.findMany as jest.Mock).mockResolvedValue([createdExpense]);

    await listExpenses(month);

    expect(db.findMany).toHaveBeenCalledWith({
      where: { date: { gte: utcStartOfMonth(month), lte: utcEndOfMonth(month) } },
      include: { expenseType: true },
      orderBy: { date: 'desc' },
    });
  });
});

describe('getExpenseTotal', () => {
  it('returns the aggregated sum for the given month', async () => {
    const month = new Date('2024-03-01T00:00:00Z');
    (db.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: 500 } });

    const result = await getExpenseTotal(month);

    expect(db.aggregate).toHaveBeenCalledWith({
      _sum: { value: true },
      where: { date: { gte: utcStartOfMonth(month), lte: utcEndOfMonth(month) } },
    });
    expect(result).toBe(500);
  });

  it('returns 0 when sum is null (no expenses in month)', async () => {
    (db.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: null } });

    const result = await getExpenseTotal(new Date());

    expect(result).toBe(0);
  });
});
