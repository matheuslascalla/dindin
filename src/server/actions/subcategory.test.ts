import {
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  listSubcategoriesByCategory,
} from './subcategory';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    subcategory: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    expense: { count: jest.fn() },
    cardExpense: { count: jest.fn() },
    expenseType: { findFirst: jest.fn() },
  },
}));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('@/lib/context', () => ({
  getContextFilter: jest.fn().mockResolvedValue({ userId: 'user-test', houseId: null }),
}));

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const db = prisma as unknown as {
  subcategory: jest.Mocked<typeof prisma.subcategory>;
  expense: jest.Mocked<typeof prisma.expense>;
  cardExpense: jest.Mocked<typeof prisma.cardExpense>;
  expenseType: jest.Mocked<typeof prisma.expenseType>;
};

const FILTER = { userId: 'user-test', houseId: null };

beforeEach(() => jest.clearAllMocks());

const validData = { name: 'Delivery', expenseTypeId: 'cat-1' };
const created = { id: 'sub-1', ...validData, ...FILTER };

describe('createSubcategory', () => {
  it('creates a subcategory and revalidates /categorias', async () => {
    (db.expenseType.findFirst as jest.Mock).mockResolvedValue({ id: 'cat-1', name: 'Alimentação' });
    (db.subcategory.create as jest.Mock).mockResolvedValue(created);

    const result = await createSubcategory(validData);

    expect(db.subcategory.create).toHaveBeenCalledWith({
      data: { ...validData, ...FILTER },
    });
    expect(revalidatePath).toHaveBeenCalledWith('/categorias');
    expect(result).toEqual(created);
  });
});

describe('updateSubcategory', () => {
  it('updates a subcategory and revalidates /categorias and /gastos', async () => {
    const updated = { ...created, name: 'Supermercado' };
    (db.subcategory.update as jest.Mock).mockResolvedValue(updated);

    const result = await updateSubcategory('sub-1', { name: 'Supermercado' });

    expect(db.subcategory.update).toHaveBeenCalledWith({
      where: { id: 'sub-1', ...FILTER },
      data: { name: 'Supermercado' },
    });
    expect(revalidatePath).toHaveBeenCalledWith('/categorias');
    expect(revalidatePath).toHaveBeenCalledWith('/gastos');
    expect(result).toEqual(updated);
  });
});

describe('deleteSubcategory', () => {
  it('deletes when no expenses are linked', async () => {
    (db.expense.count as jest.Mock).mockResolvedValue(0);
    (db.cardExpense.count as jest.Mock).mockResolvedValue(0);

    await deleteSubcategory('sub-1');

    expect(db.subcategory.delete).toHaveBeenCalledWith({ where: { id: 'sub-1', ...FILTER } });
    expect(revalidatePath).toHaveBeenCalledWith('/categorias');
  });

  it('throws when there are regular expenses linked', async () => {
    (db.expense.count as jest.Mock).mockResolvedValue(2);
    (db.cardExpense.count as jest.Mock).mockResolvedValue(0);

    await expect(deleteSubcategory('sub-1')).rejects.toThrow(/2 gasto\(s\)/);
    expect(db.subcategory.delete).not.toHaveBeenCalled();
  });

  it('throws when there are card expenses linked', async () => {
    (db.expense.count as jest.Mock).mockResolvedValue(0);
    (db.cardExpense.count as jest.Mock).mockResolvedValue(3);

    await expect(deleteSubcategory('sub-1')).rejects.toThrow(/3 gasto\(s\)/);
    expect(db.subcategory.delete).not.toHaveBeenCalled();
  });

  it('includes combined total in the error message', async () => {
    (db.expense.count as jest.Mock).mockResolvedValue(1);
    (db.cardExpense.count as jest.Mock).mockResolvedValue(2);

    await expect(deleteSubcategory('sub-1')).rejects.toThrow(/3 gasto\(s\)/);
  });
});

describe('listSubcategoriesByCategory', () => {
  it('returns subcategories of a category ordered by name ascending', async () => {
    const list = [created];
    (db.subcategory.findMany as jest.Mock).mockResolvedValue(list);

    const result = await listSubcategoriesByCategory('cat-1');

    expect(db.subcategory.findMany).toHaveBeenCalledWith({
      where: { expenseTypeId: 'cat-1', ...FILTER },
      orderBy: { name: 'asc' },
    });
    expect(result).toEqual(list);
  });
});
