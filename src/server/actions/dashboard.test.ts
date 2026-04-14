import {
  getDashboardSummary,
  getExpensesByCategory,
  getTopExpenses,
  getExpensesByPerson,
  getCardSummary,
  getCategoryAlerts,
  getMonthlyHistory,
} from './dashboard';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    income: { aggregate: jest.fn(), findMany: jest.fn() },
    expense: { findMany: jest.fn(), aggregate: jest.fn() },
    cardExpense: { findMany: jest.fn(), aggregate: jest.fn() },
    expenseType: { findMany: jest.fn() },
    creditCard: { findMany: jest.fn() },
  },
}));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('@/lib/context', () => ({
  getContextFilter: jest.fn().mockResolvedValue({ userId: 'user-test', houseId: null }),
}));

import { prisma } from '@/lib/prisma';

const incomeDb = prisma.income as jest.Mocked<typeof prisma.income>;
const expenseDb = prisma.expense as jest.Mocked<typeof prisma.expense>;
const cardExpenseDb = prisma.cardExpense as jest.Mocked<typeof prisma.cardExpense>;
const expenseTypeDb = prisma.expenseType as jest.Mocked<typeof prisma.expenseType>;
const creditCardDb = prisma.creditCard as jest.Mocked<typeof prisma.creditCard>;

beforeEach(() => {
  jest.clearAllMocks();
  (incomeDb.findMany as jest.Mock).mockResolvedValue([]);
});

const month = new Date('2024-03-01T00:00:00Z');

// ─── getDashboardSummary ────────────────────────────────────────────────────

describe('getDashboardSummary', () => {
  it('calculates balance = monthlyIncome - totalExpenses', async () => {
    (incomeDb.aggregate as jest.Mock)
      .mockResolvedValueOnce({ _sum: { value: 5000 } }) // monthly income
      .mockResolvedValueOnce({ _sum: { value: 200 } }); // eventual income
    (expenseDb.findMany as jest.Mock).mockResolvedValue([{ name: 'A', value: 1000 }]);
    (cardExpenseDb.findMany as jest.Mock).mockResolvedValue([{ name: 'B', value: 2000 }]);

    const result = await getDashboardSummary(month);

    expect(result.monthlyIncome).toBe(5000);
    expect(result.eventualIncome).toBe(200);
    expect(result.totalExpenses).toBe(3000);
    expect(result.balance).toBe(2200); // (5000 + 200) - 3000
  });

  it('identifies the biggest expense across both sources', async () => {
    (incomeDb.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: 5000 } });
    (expenseDb.findMany as jest.Mock).mockResolvedValue([
      { name: 'Menor', value: 100 },
      { name: 'Maior', value: 800 },
    ]);
    (cardExpenseDb.findMany as jest.Mock).mockResolvedValue([{ name: 'Médio', value: 500 }]);

    const result = await getDashboardSummary(month);

    expect(result.biggestExpense).toEqual({ name: 'Maior', value: 800 });
  });

  it('returns biggestExpense=null and totalExpenses=0 when there are no expenses', async () => {
    (incomeDb.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: 5000 } });
    (expenseDb.findMany as jest.Mock).mockResolvedValue([]);
    (cardExpenseDb.findMany as jest.Mock).mockResolvedValue([]);

    const result = await getDashboardSummary(month);

    expect(result.biggestExpense).toBeNull();
    expect(result.totalExpenses).toBe(0);
  });

  it('handles null aggregate sums (returns 0)', async () => {
    (incomeDb.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: null } });
    (expenseDb.findMany as jest.Mock).mockResolvedValue([]);
    (cardExpenseDb.findMany as jest.Mock).mockResolvedValue([]);

    const result = await getDashboardSummary(month);

    expect(result.monthlyIncome).toBe(0);
    expect(result.balance).toBe(0);
  });
});

// ─── getExpensesByCategory ──────────────────────────────────────────────────

describe('getExpensesByCategory', () => {
  const makeCategory = (overrides = {}) => ({
    id: 'cat-1',
    name: 'Alimentação',
    color: '#6B7280',
    limitPercent: 20,
    expenses: [],
    cardExpenses: [],
    ...overrides,
  });

  it('returns status=danger when percentOfLimit >= 100', async () => {
    // totalIncome=5000 (monthly=5000, eventual=0), expenses=1000, limitPercent=20 → percentOfIncome=20 → percentOfLimit=100
    (expenseTypeDb.findMany as jest.Mock).mockResolvedValue([
      makeCategory({ expenses: [{ value: 1000 }] }),
    ]);
    (incomeDb.aggregate as jest.Mock)
      .mockResolvedValueOnce({ _sum: { value: 5000 } }) // monthly
      .mockResolvedValueOnce({ _sum: { value: 0 } }); // eventual

    const [result] = await getExpensesByCategory(month);

    expect(result.status).toBe('danger');
    expect(result.percentOfIncome).toBeCloseTo(20);
  });

  it('returns status=warning when percentOfLimit is between 80 and 100', async () => {
    // totalIncome=5000 (monthly=5000, eventual=0), expenses=800, limitPercent=20 → percentOfIncome=16 → percentOfLimit=80
    (expenseTypeDb.findMany as jest.Mock).mockResolvedValue([
      makeCategory({ expenses: [{ value: 800 }] }),
    ]);
    (incomeDb.aggregate as jest.Mock)
      .mockResolvedValueOnce({ _sum: { value: 5000 } }) // monthly
      .mockResolvedValueOnce({ _sum: { value: 0 } }); // eventual

    const [result] = await getExpensesByCategory(month);

    expect(result.status).toBe('warning');
  });

  it('returns status=ok when percentOfLimit < 80', async () => {
    // income=5000, expenses=100, limitPercent=20 → percentOfIncome=2 → percentOfLimit=10
    (expenseTypeDb.findMany as jest.Mock).mockResolvedValue([
      makeCategory({ expenses: [{ value: 100 }] }),
    ]);
    (incomeDb.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: 5000 } });

    const [result] = await getExpensesByCategory(month);

    expect(result.status).toBe('ok');
  });

  it('returns percentOfIncome=0 when income is zero', async () => {
    (expenseTypeDb.findMany as jest.Mock).mockResolvedValue([
      makeCategory({ expenses: [{ value: 500 }] }),
    ]);
    (incomeDb.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: 0 } });

    const [result] = await getExpensesByCategory(month);

    expect(result.percentOfIncome).toBe(0);
    expect(result.status).toBe('ok');
  });

  it('sums both expense and cardExpense values', async () => {
    (expenseTypeDb.findMany as jest.Mock).mockResolvedValue([
      makeCategory({ expenses: [{ value: 300 }], cardExpenses: [{ value: 200 }] }),
    ]);
    (incomeDb.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: 5000 } });

    const [result] = await getExpensesByCategory(month);

    expect(result.totalValue).toBe(500);
  });
});

// ─── getTopExpenses ──────────────────────────────────────────────────────────

describe('getTopExpenses', () => {
  const expenseType = { name: 'Alimentação', color: '#6B7280' };
  const card = { name: 'Nubank' };

  it('merges and sorts by value descending', async () => {
    (expenseDb.findMany as jest.Mock).mockResolvedValue([
      { name: 'A', value: 100, expenseType, person: null },
    ]);
    (cardExpenseDb.findMany as jest.Mock).mockResolvedValue([
      { name: 'B', value: 500, expenseType, card, person: null },
      { name: 'C', value: 200, expenseType, card, person: null },
    ]);

    const result = await getTopExpenses(month);

    expect(result[0].name).toBe('B');
    expect(result[1].name).toBe('C');
    expect(result[2].name).toBe('A');
  });

  it('respects the limit parameter', async () => {
    (expenseDb.findMany as jest.Mock).mockResolvedValue([
      { name: 'A', value: 100, expenseType, person: null },
      { name: 'D', value: 50, expenseType, person: null },
    ]);
    (cardExpenseDb.findMany as jest.Mock).mockResolvedValue([
      { name: 'B', value: 500, expenseType, card, person: null },
      { name: 'C', value: 200, expenseType, card, person: null },
      { name: 'E', value: 10, expenseType, card, person: null },
    ]);

    const result = await getTopExpenses(month, 2);

    expect(result).toHaveLength(2);
    expect(result[0].value).toBe(500);
  });

  it('assigns source=expense vs source=card correctly', async () => {
    (expenseDb.findMany as jest.Mock).mockResolvedValue([
      { name: 'Regular', value: 100, expenseType, person: null },
    ]);
    (cardExpenseDb.findMany as jest.Mock).mockResolvedValue([
      { name: 'Card', value: 200, expenseType, card, person: null },
    ]);

    const result = await getTopExpenses(month);

    const regularExp = result.find((e) => e.name === 'Regular');
    const cardExp = result.find((e) => e.name === 'Card');
    expect(regularExp?.source).toBe('expense');
    expect(regularExp?.cardName).toBeUndefined();
    expect(cardExp?.source).toBe('card');
    expect(cardExp?.cardName).toBe('Nubank');
  });
});

// ─── getExpensesByPerson ────────────────────────────────────────────────────

describe('getExpensesByPerson', () => {
  it('sums expenses for the same person across both sources', async () => {
    (expenseDb.findMany as jest.Mock).mockResolvedValue([
      { person: 'Maria', value: 200 },
      { person: 'João', value: 100 },
    ]);
    (cardExpenseDb.findMany as jest.Mock).mockResolvedValue([{ person: 'Maria', value: 300 }]);

    const result = await getExpensesByPerson(month);

    const maria = result.find((r) => r.person === 'Maria');
    const joao = result.find((r) => r.person === 'João');
    expect(maria?.totalValue).toBe(500);
    expect(joao?.totalValue).toBe(100);
  });

  it('sorts by totalValue descending', async () => {
    (expenseDb.findMany as jest.Mock).mockResolvedValue([{ person: 'João', value: 100 }]);
    (cardExpenseDb.findMany as jest.Mock).mockResolvedValue([{ person: 'Maria', value: 800 }]);

    const result = await getExpensesByPerson(month);

    expect(result[0].person).toBe('Maria');
    expect(result[1].person).toBe('João');
  });

  it('returns empty array when no person-attributed expenses exist', async () => {
    (expenseDb.findMany as jest.Mock).mockResolvedValue([]);
    (cardExpenseDb.findMany as jest.Mock).mockResolvedValue([]);

    const result = await getExpensesByPerson(month);

    expect(result).toEqual([]);
  });
});

// ─── getCardSummary ─────────────────────────────────────────────────────────

describe('getCardSummary', () => {
  it('returns totalValue and expenseCount per card', async () => {
    (creditCardDb.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'card-1',
        name: 'Nubank',
        expenses: [{ value: 300 }, { value: 200 }],
      },
    ]);

    const result = await getCardSummary(month);

    expect(result[0]).toEqual({
      cardId: 'card-1',
      cardName: 'Nubank',
      totalValue: 500,
      expenseCount: 2,
    });
  });

  it('returns totalValue=0 and expenseCount=0 for a card with no expenses', async () => {
    (creditCardDb.findMany as jest.Mock).mockResolvedValue([
      { id: 'card-2', name: 'Inter', expenses: [] },
    ]);

    const result = await getCardSummary(month);

    expect(result[0].totalValue).toBe(0);
    expect(result[0].expenseCount).toBe(0);
  });
});

// ─── getCategoryAlerts ──────────────────────────────────────────────────────

describe('getCategoryAlerts', () => {
  const makeCategory = (
    status: 'ok' | 'warning' | 'danger',
    expenses: number,
    income: number,
    limitPercent: number
  ) => ({
    id: `cat-${status}`,
    name: status,
    color: '#000',
    limitPercent,
    expenses: [{ value: expenses }],
    cardExpenses: [],
  });

  it('excludes ok categories', async () => {
    (expenseTypeDb.findMany as jest.Mock).mockResolvedValue([makeCategory('ok', 50, 5000, 20)]);
    (incomeDb.aggregate as jest.Mock)
      .mockResolvedValueOnce({ _sum: { value: 5000 } }) // monthly
      .mockResolvedValueOnce({ _sum: { value: 0 } }); // eventual

    const result = await getCategoryAlerts(month);

    expect(result).toHaveLength(0);
  });

  it('includes warning and danger categories', async () => {
    (expenseTypeDb.findMany as jest.Mock).mockResolvedValue([
      // totalIncome=5000 (monthly=5000, eventual=0): 1000/5000=20%, limit=20% → percentOfLimit=100% → danger
      {
        id: 'cat-danger',
        name: 'Danger Cat',
        color: '#F00',
        limitPercent: 20,
        expenses: [{ value: 1000 }],
        cardExpenses: [],
      },
      // totalIncome=5000 (monthly=5000, eventual=0): 800/5000=16%, limit=20% → percentOfLimit=80% → warning
      {
        id: 'cat-warning',
        name: 'Warning Cat',
        color: '#FF0',
        limitPercent: 20,
        expenses: [{ value: 800 }],
        cardExpenses: [],
      },
    ]);
    (incomeDb.aggregate as jest.Mock)
      .mockResolvedValueOnce({ _sum: { value: 5000 } }) // monthly
      .mockResolvedValueOnce({ _sum: { value: 0 } }); // eventual

    const result = await getCategoryAlerts(month);

    expect(result).toHaveLength(2);
    expect(result.every((r) => r.status === 'warning' || r.status === 'danger')).toBe(true);
  });

  it('maps currentPercent from percentOfIncome', async () => {
    (expenseTypeDb.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'cat-1',
        name: 'Test',
        color: '#F00',
        limitPercent: 5,
        expenses: [{ value: 1000 }],
        cardExpenses: [],
      },
    ]);
    (incomeDb.aggregate as jest.Mock)
      .mockResolvedValueOnce({ _sum: { value: 5000 } }) // monthly
      .mockResolvedValueOnce({ _sum: { value: 0 } }); // eventual

    const [alert] = await getCategoryAlerts(month);

    expect(alert.currentPercent).toBeCloseTo(20); // 1000/5000*100
    expect(alert.limitPercent).toBe(5);
  });
});

// ─── getMonthlyHistory ──────────────────────────────────────────────────────

describe('getMonthlyHistory', () => {
  it('returns an array with length equal to the months param', async () => {
    (incomeDb.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: 5000 } });
    (expenseDb.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: 1000 } });
    (cardExpenseDb.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: 500 } });

    const result = await getMonthlyHistory(4);

    expect(result).toHaveLength(4);
  });

  it('each entry has month, income, and expenses fields', async () => {
    (incomeDb.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: 5000 } });
    (expenseDb.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: 1000 } });
    (cardExpenseDb.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: 500 } });

    const result = await getMonthlyHistory(3);

    result.forEach((entry) => {
      expect(entry).toHaveProperty('month');
      expect(entry).toHaveProperty('income');
      expect(entry).toHaveProperty('expenses');
    });
  });

  it('income is the same value for all months (aggregate, not per-month)', async () => {
    // monthly=8000 + eventual=8000 (mockResolvedValue applies to all aggregate calls) → income=16000/month
    (incomeDb.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: 8000 } });
    (expenseDb.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: 1000 } });
    (cardExpenseDb.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: 500 } });

    const result = await getMonthlyHistory(3);

    expect(result.every((r) => r.income === 16000)).toBe(true);
  });

  it('expenses = regularExpenses + cardExpenses for each month', async () => {
    (incomeDb.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: 5000 } });
    (expenseDb.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: 1000 } });
    (cardExpenseDb.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: 500 } });

    const result = await getMonthlyHistory(2);

    result.forEach((entry) => {
      expect(entry.expenses).toBe(1500);
    });
  });

  it('handles null sums gracefully', async () => {
    (incomeDb.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: null } });
    (expenseDb.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: null } });
    (cardExpenseDb.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: null } });

    const result = await getMonthlyHistory(2);

    result.forEach((entry) => {
      expect(entry.income).toBe(0);
      expect(entry.expenses).toBe(0);
    });
  });
});
