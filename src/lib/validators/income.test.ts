import {
  CreateIncomeSchema,
  UpdateIncomeSchema,
  IncomeFiltersSchema,
  RecurrenceEnum,
} from './income';

const validInput = {
  name: 'Salário',
  value: 5000,
  recurrence: 'monthly',
  startDate: '2024-01-01',
};

describe('RecurrenceEnum', () => {
  it('accepts monthly', () => {
    expect(RecurrenceEnum.safeParse('monthly').success).toBe(true);
  });

  it('accepts weekly', () => {
    expect(RecurrenceEnum.safeParse('weekly').success).toBe(true);
  });

  it('accepts eventual', () => {
    expect(RecurrenceEnum.safeParse('eventual').success).toBe(true);
  });

  it('rejects unknown values', () => {
    expect(RecurrenceEnum.safeParse('daily').success).toBe(false);
    expect(RecurrenceEnum.safeParse('').success).toBe(false);
  });
});

describe('CreateIncomeSchema', () => {
  it('accepts a valid monthly income', () => {
    expect(CreateIncomeSchema.safeParse(validInput).success).toBe(true);
  });

  it('accepts a valid eventual income', () => {
    expect(CreateIncomeSchema.safeParse({ ...validInput, recurrence: 'eventual' }).success).toBe(
      true
    );
  });

  it('defaults active to true when omitted', () => {
    const result = CreateIncomeSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.active).toBe(true);
  });

  it('accepts explicit active = false', () => {
    const result = CreateIncomeSchema.safeParse({ ...validInput, active: false });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.active).toBe(false);
  });

  it('rejects empty name', () => {
    expect(CreateIncomeSchema.safeParse({ ...validInput, name: '' }).success).toBe(false);
  });

  it('rejects value = 0', () => {
    expect(CreateIncomeSchema.safeParse({ ...validInput, value: 0 }).success).toBe(false);
  });

  it('rejects negative value', () => {
    expect(CreateIncomeSchema.safeParse({ ...validInput, value: -1 }).success).toBe(false);
  });

  it('rejects invalid recurrence', () => {
    expect(CreateIncomeSchema.safeParse({ ...validInput, recurrence: 'biweekly' }).success).toBe(
      false
    );
  });

  it('coerces startDate from ISO string', () => {
    const result = CreateIncomeSchema.safeParse({
      ...validInput,
      startDate: '2024-01-01T00:00:00Z',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.startDate).toBeInstanceOf(Date);
  });
});

describe('UpdateIncomeSchema', () => {
  it('accepts an empty object', () => {
    expect(UpdateIncomeSchema.safeParse({}).success).toBe(true);
  });

  it('accepts partial update with only active', () => {
    expect(UpdateIncomeSchema.safeParse({ active: false }).success).toBe(true);
  });

  it('accepts partial update with only value', () => {
    expect(UpdateIncomeSchema.safeParse({ value: 6000 }).success).toBe(true);
  });

  it('still rejects invalid recurrence when provided', () => {
    expect(UpdateIncomeSchema.safeParse({ recurrence: 'biweekly' }).success).toBe(false);
  });
});

describe('IncomeFiltersSchema', () => {
  it('accepts an empty object', () => {
    expect(IncomeFiltersSchema.safeParse({}).success).toBe(true);
  });

  it('accepts active filter', () => {
    expect(IncomeFiltersSchema.safeParse({ active: true }).success).toBe(true);
  });

  it('accepts recurrence filter', () => {
    expect(IncomeFiltersSchema.safeParse({ recurrence: 'monthly' }).success).toBe(true);
  });

  it('accepts combined filters', () => {
    expect(IncomeFiltersSchema.safeParse({ active: true, recurrence: 'eventual' }).success).toBe(
      true
    );
  });

  it('rejects invalid recurrence in filter', () => {
    expect(IncomeFiltersSchema.safeParse({ recurrence: 'never' }).success).toBe(false);
  });
});
