import {
  createExpense,
  updateExpense,
  deleteExpense,
  listExpenses,
  listAllExpenses,
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
    cardExpense: {
      findMany: jest.fn(),
    },
  },
}));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('@/lib/context', () => ({
  getContextFilter: jest.fn().mockResolvedValue({ userId: 'user-test', houseId: null }),
}));

const db = prisma.expense as jest.Mocked<typeof prisma.expense>;
const cardDb = prisma.cardExpense as jest.Mocked<typeof prisma.cardExpense>;
const FILTER = { userId: 'user-test', houseId: null };

beforeEach(() => jest.clearAllMocks());

const validExpense = {
  name: 'Mercado',
  value: 150,
  date: new Date('2024-03-15T00:00:00Z'),
  paymentMethod: 'PIX' as const,
  expenseTypeId: 'type-1',
};

const expenseType = { id: 'type-1', name: 'Alimentação', color: '#6B7280', icon: 'ShoppingCart' };

const createdExpense = {
  id: 'exp-1',
  ...validExpense,
  expenseType: { id: 'type-1', name: 'Alimentação', color: '#6B7280' },
  createdAt: new Date(),
};

const rawExpense = {
  id: 'exp-1',
  name: 'Mercado',
  value: 150,
  date: new Date('2024-03-15T00:00:00Z'),
  description: null,
  person: null,
  paymentMethod: 'PIX',
  expenseType,
};

const rawCardExpense = {
  id: 'ce-1',
  name: 'Netflix',
  value: 40,
  date: new Date('2024-03-20T00:00:00Z'),
  description: null,
  person: null,
  recurrence: 'monthly',
  installmentNumber: null,
  installmentTotal: null,
  installmentGroupId: null,
  expenseType,
  card: { id: 'card-1', name: 'Nubank' },
};

describe('createExpense', () => {
  it('creates an expense and revalidates /gastos and /dashboard', async () => {
    (db.create as jest.Mock).mockResolvedValue(createdExpense);

    const result = await createExpense(validExpense);

    expect(db.create).toHaveBeenCalledWith({
      data: { ...validExpense, ...FILTER },
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
      where: { id: 'exp-1', ...FILTER },
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

    expect(db.delete).toHaveBeenCalledWith({ where: { id: 'exp-1', ...FILTER } });
    expect(revalidatePath).toHaveBeenCalledWith('/gastos');
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
  });
});

describe('listExpenses', () => {
  it('returns all expenses without date filter when month is not provided', async () => {
    (db.findMany as jest.Mock).mockResolvedValue([createdExpense]);

    const result = await listExpenses();

    expect(db.findMany).toHaveBeenCalledWith({
      where: { ...FILTER },
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
      where: { ...FILTER, date: { gte: utcStartOfMonth(month), lte: utcEndOfMonth(month) } },
      include: { expenseType: true },
      orderBy: { date: 'desc' },
    });
  });
});

describe('listAllExpenses', () => {
  const month = new Date('2024-03-01T00:00:00Z');

  beforeEach(() => {
    (db.findMany as jest.Mock).mockResolvedValue([]);
    (cardDb.findMany as jest.Mock).mockResolvedValue([]);
  });

  it('merges and sorts expenses and card expenses by date descending', async () => {
    (db.findMany as jest.Mock).mockResolvedValue([rawExpense]);
    (cardDb.findMany as jest.Mock).mockResolvedValue([rawCardExpense]);

    const result = await listAllExpenses({ month });

    expect(result.total).toBe(2);
    expect(result.totalValue).toBe(190);
    expect(result.items[0].id).toBe('ce-1'); // newer date first
    expect(result.items[1].id).toBe('exp-1');
  });

  it('maps source field correctly', async () => {
    (db.findMany as jest.Mock).mockResolvedValue([rawExpense]);
    (cardDb.findMany as jest.Mock).mockResolvedValue([rawCardExpense]);

    const result = await listAllExpenses({ month });

    const expense = result.items.find((i) => i.id === 'exp-1');
    const card = result.items.find((i) => i.id === 'ce-1');
    expect(expense?.source).toBe('expense');
    expect(expense?.paymentMethod).toBe('PIX');
    expect(card?.source).toBe('card');
    expect(card?.cardName).toBe('Nubank');
  });

  it('skips card query when paymentMethod is PIX', async () => {
    (db.findMany as jest.Mock).mockResolvedValue([rawExpense]);

    await listAllExpenses({ month, paymentMethod: 'PIX' });

    expect(db.findMany).toHaveBeenCalled();
    expect(cardDb.findMany).not.toHaveBeenCalled();
  });

  it('skips card query when paymentMethod is MONEY', async () => {
    await listAllExpenses({ month, paymentMethod: 'MONEY' });

    expect(cardDb.findMany).not.toHaveBeenCalled();
  });

  it('skips expense query when paymentMethod is CARD', async () => {
    (cardDb.findMany as jest.Mock).mockResolvedValue([rawCardExpense]);

    await listAllExpenses({ month, paymentMethod: 'CARD' });

    expect(db.findMany).not.toHaveBeenCalled();
    expect(cardDb.findMany).toHaveBeenCalled();
  });

  it('applies categoryId filter to expense query', async () => {
    await listAllExpenses({ month, categoryId: 'cat-1' });

    expect(db.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ expenseTypeId: 'cat-1' }) })
    );
  });

  it('applies person filter to both queries', async () => {
    await listAllExpenses({ month, person: 'João' });

    expect(db.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ person: 'João' }) })
    );
    expect(cardDb.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ person: 'João' }) })
    );
  });

  it('paginates results correctly', async () => {
    const manyExpenses = Array.from({ length: 25 }, (_, i) => ({
      ...rawExpense,
      id: `exp-${i}`,
      date: new Date(`2024-03-${String(i + 1).padStart(2, '0')}T00:00:00Z`),
    }));
    (db.findMany as jest.Mock).mockResolvedValue(manyExpenses);

    const page1 = await listAllExpenses({ month, page: 1, pageSize: 10 });
    const page2 = await listAllExpenses({ month, page: 2, pageSize: 10 });

    expect(page1.total).toBe(25);
    expect(page1.pageCount).toBe(3);
    expect(page1.items).toHaveLength(10);
    expect(page2.items).toHaveLength(10);
  });

  it('returns empty result when no expenses exist', async () => {
    const result = await listAllExpenses({ month });

    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.totalValue).toBe(0);
    expect(result.pageCount).toBe(0);
  });

  it('uses current month when no month is provided', async () => {
    await listAllExpenses({});

    expect(db.findMany).toHaveBeenCalled();
  });
});

describe('getExpenseTotal', () => {
  it('returns the aggregated sum for the given month', async () => {
    const month = new Date('2024-03-01T00:00:00Z');
    (db.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: 500 } });

    const result = await getExpenseTotal(month);

    expect(db.aggregate).toHaveBeenCalledWith({
      _sum: { value: true },
      where: { ...FILTER, date: { gte: utcStartOfMonth(month), lte: utcEndOfMonth(month) } },
    });
    expect(result).toBe(500);
  });

  it('returns 0 when sum is null (no expenses in month)', async () => {
    (db.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: null } });

    const result = await getExpenseTotal(new Date());

    expect(result).toBe(0);
  });
});
