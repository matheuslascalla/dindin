import {
  createCard,
  updateCard,
  deleteCard,
  listCards,
  createCardExpense,
  updateCardExpense,
  deleteCardExpense,
  deleteInstallmentGroup,
  listCardExpenses,
  getCardTotal,
  getAllCardsTotal,
} from './card';
import { cardExpenseMonthFilter, utcStartOfMonth, utcEndOfMonth } from '@/lib/utils';

const MOCK_UUID = 'mock-uuid-1234';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    creditCard: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    cardExpense: {
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
  },
}));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('crypto', () => ({ randomUUID: jest.fn(() => MOCK_UUID) }));
jest.mock('@/lib/context', () => ({
  getContextFilter: jest.fn().mockResolvedValue({ userId: 'user-test', houseId: null }),
}));

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const cardDb = prisma.creditCard as jest.Mocked<typeof prisma.creditCard>;
const expenseDb = prisma.cardExpense as jest.Mocked<typeof prisma.cardExpense>;

beforeEach(() => jest.clearAllMocks());

const validCard = { name: 'Nubank', brand: 'Mastercard' };
const createdCard = { id: 'card-1', ...validCard, createdAt: new Date() };

const baseExpenseInput = {
  cardId: 'card-1',
  name: 'Compra',
  date: new Date('2024-03-15T00:00:00Z'),
  value: 100,
  expenseTypeId: 'type-1',
  kind: 'none' as const,
};

describe('createCard', () => {
  it('creates a card and revalidates /cartoes', async () => {
    (cardDb.create as jest.Mock).mockResolvedValue(createdCard);

    const result = await createCard(validCard);

    expect(cardDb.create).toHaveBeenCalledWith({ data: validCard });
    expect(revalidatePath).toHaveBeenCalledWith('/cartoes');
    expect(result).toEqual(createdCard);
  });
});

describe('updateCard', () => {
  it('updates a card and revalidates /cartoes', async () => {
    (cardDb.update as jest.Mock).mockResolvedValue({ ...createdCard, name: 'Inter' });

    await updateCard('card-1', { name: 'Inter' });

    expect(cardDb.update).toHaveBeenCalledWith({
      where: { id: 'card-1' },
      data: { name: 'Inter' },
    });
    expect(revalidatePath).toHaveBeenCalledWith('/cartoes');
  });
});

describe('deleteCard', () => {
  it('deletes a card and revalidates /cartoes and /dashboard', async () => {
    (cardDb.delete as jest.Mock).mockResolvedValue(createdCard);

    await deleteCard('card-1');

    expect(cardDb.delete).toHaveBeenCalledWith({ where: { id: 'card-1' } });
    expect(revalidatePath).toHaveBeenCalledWith('/cartoes');
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
  });
});

describe('listCards', () => {
  it('returns cards with expense count', async () => {
    const cards = [{ ...createdCard, _count: { expenses: 3 } }];
    (cardDb.findMany as jest.Mock).mockResolvedValue(cards);

    const result = await listCards();

    expect(cardDb.findMany).toHaveBeenCalledWith({
      include: { _count: { select: { expenses: true } } },
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual(cards);
  });
});

describe('createCardExpense', () => {
  it('creates a one-off expense (kind=none)', async () => {
    (expenseDb.create as jest.Mock).mockResolvedValue({});

    await createCardExpense(baseExpenseInput);

    expect(expenseDb.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ recurrence: 'none', cardId: 'card-1' }),
    });
    expect(expenseDb.createMany).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/cartoes');
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
  });

  it('creates a monthly recurrence expense (kind=monthly)', async () => {
    (expenseDb.create as jest.Mock).mockResolvedValue({});

    await createCardExpense({ ...baseExpenseInput, kind: 'monthly' });

    expect(expenseDb.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ recurrence: 'monthly' }),
    });
  });

  it('creates installments with createMany (kind=installment)', async () => {
    (expenseDb.createMany as jest.Mock).mockResolvedValue({ count: 3 });

    await createCardExpense({ ...baseExpenseInput, kind: 'installment', installmentCount: 3 });

    expect(expenseDb.createMany).toHaveBeenCalledTimes(1);
    expect(expenseDb.create).not.toHaveBeenCalled();

    const { data: items } = (expenseDb.createMany as jest.Mock).mock.calls[0][0];
    expect(items).toHaveLength(3);
  });

  it('installments all share the same groupId', async () => {
    (expenseDb.createMany as jest.Mock).mockResolvedValue({ count: 3 });

    await createCardExpense({ ...baseExpenseInput, kind: 'installment', installmentCount: 3 });

    const { data: items } = (expenseDb.createMany as jest.Mock).mock.calls[0][0];
    expect(
      items.every((i: { installmentGroupId: string }) => i.installmentGroupId === MOCK_UUID)
    ).toBe(true);
  });

  it('installments have correct installmentNumber and installmentTotal', async () => {
    (expenseDb.createMany as jest.Mock).mockResolvedValue({ count: 3 });

    await createCardExpense({ ...baseExpenseInput, kind: 'installment', installmentCount: 3 });

    const { data: items } = (expenseDb.createMany as jest.Mock).mock.calls[0][0];
    expect(items[0].installmentNumber).toBe(1);
    expect(items[1].installmentNumber).toBe(2);
    expect(items[2].installmentNumber).toBe(3);
    expect(items.every((i: { installmentTotal: number }) => i.installmentTotal === 3)).toBe(true);
  });

  it('sets description to null when empty string', async () => {
    (expenseDb.create as jest.Mock).mockResolvedValue({});

    await createCardExpense({ ...baseExpenseInput, description: '' });

    const { data } = (expenseDb.create as jest.Mock).mock.calls[0][0];
    expect(data.description).toBeNull();
  });
});

describe('updateCardExpense', () => {
  it('updates expense and revalidates /cartoes and /dashboard', async () => {
    (expenseDb.update as jest.Mock).mockResolvedValue({});

    await updateCardExpense('exp-1', { value: 200 });

    expect(expenseDb.update).toHaveBeenCalledWith({
      where: { id: 'exp-1' },
      data: { value: 200 },
      include: { expenseType: true, card: true },
    });
    expect(revalidatePath).toHaveBeenCalledWith('/cartoes');
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
  });
});

describe('deleteCardExpense', () => {
  it('deletes a single expense and revalidates', async () => {
    (expenseDb.delete as jest.Mock).mockResolvedValue({});

    await deleteCardExpense('exp-1');

    expect(expenseDb.delete).toHaveBeenCalledWith({ where: { id: 'exp-1' } });
    expect(revalidatePath).toHaveBeenCalledWith('/cartoes');
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
  });
});

describe('deleteInstallmentGroup', () => {
  it('batch-deletes all expenses with the given groupId', async () => {
    (expenseDb.deleteMany as jest.Mock).mockResolvedValue({ count: 6 });

    await deleteInstallmentGroup('group-abc');

    expect(expenseDb.deleteMany).toHaveBeenCalledWith({
      where: { installmentGroupId: 'group-abc' },
    });
    expect(revalidatePath).toHaveBeenCalledWith('/cartoes');
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
  });
});

describe('listCardExpenses', () => {
  it('returns all expenses without month filter when month is omitted', async () => {
    (expenseDb.findMany as jest.Mock).mockResolvedValue([]);

    await listCardExpenses('card-1');

    expect(expenseDb.findMany).toHaveBeenCalledWith({
      where: { cardId: 'card-1' },
      include: { expenseType: true },
      orderBy: { date: 'desc' },
    });
  });

  it('applies month filter when month is provided', async () => {
    const month = new Date('2024-03-01T00:00:00Z');
    const filter = cardExpenseMonthFilter(utcStartOfMonth(month), utcEndOfMonth(month));
    (expenseDb.findMany as jest.Mock).mockResolvedValue([]);

    await listCardExpenses('card-1', month);

    expect(expenseDb.findMany).toHaveBeenCalledWith({
      where: { cardId: 'card-1', ...filter },
      include: { expenseType: true },
      orderBy: { date: 'desc' },
    });
  });
});

describe('getCardTotal', () => {
  it('returns the sum for a specific card in the given month', async () => {
    const month = new Date('2024-03-01T00:00:00Z');
    (expenseDb.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: 750 } });

    const result = await getCardTotal('card-1', month);

    expect(result).toBe(750);
  });

  it('returns 0 when sum is null', async () => {
    (expenseDb.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: null } });

    const result = await getCardTotal('card-1', new Date());

    expect(result).toBe(0);
  });
});

describe('getAllCardsTotal', () => {
  it('returns the sum across all cards for the given month', async () => {
    const month = new Date('2024-03-01T00:00:00Z');
    (expenseDb.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: 2000 } });

    const result = await getAllCardsTotal(month);

    expect(result).toBe(2000);
  });

  it('returns 0 when sum is null', async () => {
    (expenseDb.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: null } });

    const result = await getAllCardsTotal(new Date());

    expect(result).toBe(0);
  });
});
