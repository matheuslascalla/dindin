import { CreateCardSchema, UpdateCardSchema, CreateCardExpenseSchema } from './card';

const baseExpense = {
  cardId: 'card-1',
  name: 'Compra',
  date: '2024-03-15',
  value: 100,
  expenseTypeId: 'type-1',
};

describe('CreateCardSchema', () => {
  it('accepts a valid card with name only', () => {
    const result = CreateCardSchema.safeParse({ name: 'Nubank' });
    expect(result.success).toBe(true);
  });

  it('accepts a card with brand', () => {
    const result = CreateCardSchema.safeParse({ name: 'Nubank', brand: 'Visa' });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = CreateCardSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects name longer than 100 characters', () => {
    const result = CreateCardSchema.safeParse({ name: 'a'.repeat(101) });
    expect(result.success).toBe(false);
  });
});

describe('UpdateCardSchema', () => {
  it('accepts an empty object (all fields optional)', () => {
    const result = UpdateCardSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts partial update with just brand', () => {
    const result = UpdateCardSchema.safeParse({ brand: 'Mastercard' });
    expect(result.success).toBe(true);
  });
});

describe('CreateCardExpenseSchema', () => {
  it('accepts a valid one-off expense', () => {
    const result = CreateCardExpenseSchema.safeParse({ ...baseExpense, kind: 'none' });
    expect(result.success).toBe(true);
  });

  it('accepts a monthly recurrence expense', () => {
    const result = CreateCardExpenseSchema.safeParse({ ...baseExpense, kind: 'monthly' });
    expect(result.success).toBe(true);
  });

  it('accepts an installment expense with count >= 2', () => {
    const result = CreateCardExpenseSchema.safeParse({
      ...baseExpense,
      kind: 'installment',
      installmentCount: 6,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an installment expense without installmentCount', () => {
    const result = CreateCardExpenseSchema.safeParse({ ...baseExpense, kind: 'installment' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('installmentCount');
    }
  });

  it('rejects an installment expense with count < 2', () => {
    const result = CreateCardExpenseSchema.safeParse({
      ...baseExpense,
      kind: 'installment',
      installmentCount: 1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects value <= 0', () => {
    const result = CreateCardExpenseSchema.safeParse({ ...baseExpense, value: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects missing cardId', () => {
    const { cardId: _, ...withoutCardId } = baseExpense;
    const result = CreateCardExpenseSchema.safeParse(withoutCardId);
    expect(result.success).toBe(false);
  });

  it('rejects missing expenseTypeId', () => {
    const result = CreateCardExpenseSchema.safeParse({ ...baseExpense, expenseTypeId: '' });
    expect(result.success).toBe(false);
  });

  it('defaults kind to none when omitted', () => {
    const result = CreateCardExpenseSchema.safeParse(baseExpense);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.kind).toBe('none');
    }
  });
});
