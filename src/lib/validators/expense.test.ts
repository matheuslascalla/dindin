import { CreateExpenseSchema, UpdateExpenseSchema, ExpenseFiltersSchema } from './expense';

const validInput = {
  name: 'Mercado',
  value: 150.5,
  date: '2024-03-15',
  expenseTypeId: 'type-123',
};

describe('CreateExpenseSchema', () => {
  it('accepts a valid input', () => {
    expect(CreateExpenseSchema.safeParse(validInput).success).toBe(true);
  });

  it('accepts optional fields (description, person)', () => {
    const result = CreateExpenseSchema.safeParse({
      ...validInput,
      description: 'Compras semanais',
      person: 'Maria',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    expect(CreateExpenseSchema.safeParse({ ...validInput, name: '' }).success).toBe(false);
  });

  it('rejects name longer than 100 characters', () => {
    expect(CreateExpenseSchema.safeParse({ ...validInput, name: 'a'.repeat(101) }).success).toBe(
      false
    );
  });

  it('rejects value = 0', () => {
    expect(CreateExpenseSchema.safeParse({ ...validInput, value: 0 }).success).toBe(false);
  });

  it('rejects negative value', () => {
    expect(CreateExpenseSchema.safeParse({ ...validInput, value: -10 }).success).toBe(false);
  });

  it('coerces date from ISO string', () => {
    const result = CreateExpenseSchema.safeParse({ ...validInput, date: '2024-06-01T00:00:00Z' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.date).toBeInstanceOf(Date);
  });

  it('rejects empty expenseTypeId', () => {
    expect(CreateExpenseSchema.safeParse({ ...validInput, expenseTypeId: '' }).success).toBe(false);
  });

  it('rejects missing expenseTypeId', () => {
    const { expenseTypeId: _, ...without } = validInput;
    expect(CreateExpenseSchema.safeParse(without).success).toBe(false);
  });
});

describe('UpdateExpenseSchema', () => {
  it('accepts an empty object (all fields optional)', () => {
    expect(UpdateExpenseSchema.safeParse({}).success).toBe(true);
  });

  it('accepts partial update with only value', () => {
    expect(UpdateExpenseSchema.safeParse({ value: 200 }).success).toBe(true);
  });

  it('still rejects invalid value when provided', () => {
    expect(UpdateExpenseSchema.safeParse({ value: -5 }).success).toBe(false);
  });
});

describe('ExpenseFiltersSchema', () => {
  it('accepts an empty object', () => {
    expect(ExpenseFiltersSchema.safeParse({}).success).toBe(true);
  });

  it('coerces month from ISO string', () => {
    const result = ExpenseFiltersSchema.safeParse({ month: '2024-03-01' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.month).toBeInstanceOf(Date);
  });

  it('accepts all filters combined', () => {
    const result = ExpenseFiltersSchema.safeParse({
      month: '2024-03-01',
      expenseTypeId: 'type-1',
      person: 'João',
    });
    expect(result.success).toBe(true);
  });

  it('accepts partial filters', () => {
    expect(ExpenseFiltersSchema.safeParse({ person: 'Maria' }).success).toBe(true);
  });
});
