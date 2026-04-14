import { createCategory, updateCategory, deleteCategory, listCategories } from './category';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    expenseType: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    expense: { count: jest.fn() },
    cardExpense: { count: jest.fn() },
  },
}));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('@/lib/context', () => ({
  getContextFilter: jest.fn().mockResolvedValue({ userId: 'user-test', houseId: null }),
}));

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const db = prisma as unknown as {
  expenseType: jest.Mocked<typeof prisma.expenseType>;
  expense: jest.Mocked<typeof prisma.expense>;
  cardExpense: jest.Mocked<typeof prisma.cardExpense>;
};

const FILTER = { userId: 'user-test', houseId: null };

beforeEach(() => jest.clearAllMocks());

const validCategory = {
  name: 'Alimentação',
  limitPercent: 20,
  color: '#6B7280',
  icon: '🍔',
};

const createdCategory = { id: 'cat-1', ...validCategory };

describe('createCategory', () => {
  it('creates a category and revalidates /categorias', async () => {
    (db.expenseType.create as jest.Mock).mockResolvedValue(createdCategory);

    const result = await createCategory(validCategory);

    expect(db.expenseType.create).toHaveBeenCalledWith({ data: { ...validCategory, ...FILTER } });
    expect(revalidatePath).toHaveBeenCalledWith('/categorias');
    expect(result).toEqual(createdCategory);
  });
});

describe('updateCategory', () => {
  it('updates a category and revalidates all relevant paths', async () => {
    const updated = { ...createdCategory, name: 'Alimentação Atualizada' };
    (db.expenseType.update as jest.Mock).mockResolvedValue(updated);

    await updateCategory('cat-1', { name: 'Alimentação Atualizada' });

    expect(db.expenseType.update).toHaveBeenCalledWith({
      where: { id: 'cat-1', ...FILTER },
      data: { name: 'Alimentação Atualizada' },
    });
    expect(revalidatePath).toHaveBeenCalledWith('/categorias');
    expect(revalidatePath).toHaveBeenCalledWith('/gastos');
    expect(revalidatePath).toHaveBeenCalledWith('/cartoes');
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
  });
});

describe('deleteCategory', () => {
  it('deletes when no expenses are linked', async () => {
    (db.expense.count as jest.Mock).mockResolvedValue(0);
    (db.cardExpense.count as jest.Mock).mockResolvedValue(0);

    await deleteCategory('cat-1');

    expect(db.expenseType.delete).toHaveBeenCalledWith({ where: { id: 'cat-1', ...FILTER } });
    expect(revalidatePath).toHaveBeenCalledWith('/categorias');
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
  });

  it('throws when there are regular expenses linked', async () => {
    (db.expense.count as jest.Mock).mockResolvedValue(3);
    (db.cardExpense.count as jest.Mock).mockResolvedValue(0);

    await expect(deleteCategory('cat-1')).rejects.toThrow(/3 gasto\(s\)/);
    expect(db.expenseType.delete).not.toHaveBeenCalled();
  });

  it('throws when there are card expenses linked', async () => {
    (db.expense.count as jest.Mock).mockResolvedValue(0);
    (db.cardExpense.count as jest.Mock).mockResolvedValue(2);

    await expect(deleteCategory('cat-1')).rejects.toThrow(/2 gasto\(s\)/);
    expect(db.expenseType.delete).not.toHaveBeenCalled();
  });

  it('includes combined total in the error message', async () => {
    (db.expense.count as jest.Mock).mockResolvedValue(1);
    (db.cardExpense.count as jest.Mock).mockResolvedValue(4);

    await expect(deleteCategory('cat-1')).rejects.toThrow(/5 gasto\(s\)/);
  });
});

describe('listCategories', () => {
  it('returns categories ordered by name ascending', async () => {
    const categories = [createdCategory];
    (db.expenseType.findMany as jest.Mock).mockResolvedValue(categories);

    const result = await listCategories();

    expect(db.expenseType.findMany).toHaveBeenCalledWith({
      where: { ...FILTER },
      orderBy: { name: 'asc' },
    });
    expect(result).toEqual(categories);
  });
});
