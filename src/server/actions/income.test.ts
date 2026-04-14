import {
  createIncome,
  updateIncome,
  deleteIncome,
  listIncomes,
  getTotalMonthlyIncome,
} from './income';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    income: {
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

const db = prisma.income as jest.Mocked<typeof prisma.income>;

beforeEach(() => jest.clearAllMocks());

const validIncome = {
  name: 'Salário',
  value: 5000,
  recurrence: 'monthly' as const,
  startDate: new Date('2024-01-01T00:00:00Z'),
  active: true,
};

const createdIncome = { id: 'inc-1', ...validIncome, createdAt: new Date() };

describe('createIncome', () => {
  it('creates an income and revalidates /rendas and /dashboard', async () => {
    (db.create as jest.Mock).mockResolvedValue(createdIncome);

    const result = await createIncome(validIncome);

    expect(db.create).toHaveBeenCalledWith({ data: validIncome });
    expect(revalidatePath).toHaveBeenCalledWith('/rendas');
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
    expect(result).toEqual(createdIncome);
  });
});

describe('updateIncome', () => {
  it('updates income and revalidates both paths', async () => {
    (db.update as jest.Mock).mockResolvedValue({ ...createdIncome, active: false });

    await updateIncome('inc-1', { active: false });

    expect(db.update).toHaveBeenCalledWith({
      where: { id: 'inc-1' },
      data: { active: false },
    });
    expect(revalidatePath).toHaveBeenCalledWith('/rendas');
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
  });
});

describe('deleteIncome', () => {
  it('deletes income and revalidates both paths', async () => {
    (db.delete as jest.Mock).mockResolvedValue(createdIncome);

    await deleteIncome('inc-1');

    expect(db.delete).toHaveBeenCalledWith({ where: { id: 'inc-1' } });
    expect(revalidatePath).toHaveBeenCalledWith('/rendas');
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
  });
});

describe('listIncomes', () => {
  it('returns all incomes without filters when none provided', async () => {
    (db.findMany as jest.Mock).mockResolvedValue([createdIncome]);

    const result = await listIncomes();

    expect(db.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual([createdIncome]);
  });

  it('applies active filter', async () => {
    (db.findMany as jest.Mock).mockResolvedValue([createdIncome]);

    await listIncomes({ active: true });

    expect(db.findMany).toHaveBeenCalledWith({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('applies recurrence filter', async () => {
    (db.findMany as jest.Mock).mockResolvedValue([createdIncome]);

    await listIncomes({ recurrence: 'monthly' });

    expect(db.findMany).toHaveBeenCalledWith({
      where: { recurrence: 'monthly' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('applies combined filters', async () => {
    (db.findMany as jest.Mock).mockResolvedValue([createdIncome]);

    await listIncomes({ active: false, recurrence: 'eventual' });

    expect(db.findMany).toHaveBeenCalledWith({
      where: { active: false, recurrence: 'eventual' },
      orderBy: { createdAt: 'desc' },
    });
  });
});

describe('getTotalMonthlyIncome', () => {
  it('aggregates active monthly incomes', async () => {
    (db.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: 8000 } });

    const result = await getTotalMonthlyIncome();

    expect(db.aggregate).toHaveBeenCalledWith({
      _sum: { value: true },
      where: { active: true, recurrence: 'monthly' },
    });
    expect(result).toBe(8000);
  });

  it('returns 0 when sum is null (no active monthly incomes)', async () => {
    (db.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: null } });

    const result = await getTotalMonthlyIncome();

    expect(result).toBe(0);
  });
});
