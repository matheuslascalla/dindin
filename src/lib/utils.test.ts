import {
  cn,
  formatCurrency,
  formatPercent,
  utcStartOfMonth,
  utcEndOfMonth,
  formatDate,
  RECURRENCE_LABEL,
  toDateInputValue,
  cardExpenseMonthFilter,
} from './utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('resolves tailwind conflicts (last wins)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('ignores falsy values', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b');
  });
});

describe('formatCurrency', () => {
  it('formats zero', () => {
    expect(formatCurrency(0)).toMatch(/0/);
  });

  it('formats a positive value in BRL', () => {
    const result = formatCurrency(1234.56);
    expect(result).toMatch(/1\.234/);
    expect(result).toMatch(/56/);
    expect(result).toMatch(/R\$/);
  });
});

describe('formatPercent', () => {
  it('formats with 1 decimal by default', () => {
    expect(formatPercent(42.5)).toBe('42.5%');
  });

  it('respects custom decimals', () => {
    expect(formatPercent(10, 2)).toBe('10.00%');
  });
});

describe('utcStartOfMonth', () => {
  it('returns the first day at 00:00:00 UTC', () => {
    const result = utcStartOfMonth(new Date('2024-03-15T12:00:00Z'));
    expect(result.toISOString()).toBe('2024-03-01T00:00:00.000Z');
  });
});

describe('utcEndOfMonth', () => {
  it('returns the last day at 23:59:59.999 UTC', () => {
    const result = utcEndOfMonth(new Date('2024-02-10T00:00:00Z'));
    expect(result.toISOString()).toBe('2024-02-29T23:59:59.999Z');
  });

  it('handles months with 31 days', () => {
    const result = utcEndOfMonth(new Date('2024-01-01T00:00:00Z'));
    expect(result.toISOString()).toBe('2024-01-31T23:59:59.999Z');
  });
});

describe('formatDate', () => {
  it('formats a Date in pt-BR (UTC)', () => {
    const result = formatDate(new Date('2024-03-05T00:00:00Z'));
    expect(result).toBe('05/03/2024');
  });

  it('accepts an ISO string', () => {
    const result = formatDate('2024-12-25T00:00:00Z');
    expect(result).toBe('25/12/2024');
  });
});

describe('RECURRENCE_LABEL', () => {
  it('maps all three recurrence values', () => {
    expect(RECURRENCE_LABEL.monthly).toBe('Mensal');
    expect(RECURRENCE_LABEL.weekly).toBe('Semanal');
    expect(RECURRENCE_LABEL.eventual).toBe('Eventual');
  });
});

describe('toDateInputValue', () => {
  it('converts a Date to yyyy-MM-dd', () => {
    expect(toDateInputValue(new Date('2024-06-15T10:00:00Z'))).toBe('2024-06-15');
  });

  it('accepts an ISO string', () => {
    expect(toDateInputValue('2024-01-01T00:00:00Z')).toBe('2024-01-01');
  });

  it('defaults to today (result is a valid date string)', () => {
    const result = toDateInputValue();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('cardExpenseMonthFilter', () => {
  const start = new Date('2024-03-01T00:00:00Z');
  const end = new Date('2024-03-31T23:59:59.999Z');

  it('returns an OR with two branches', () => {
    const filter = cardExpenseMonthFilter(start, end);
    expect(filter.OR).toHaveLength(2);
  });

  it('first branch targets one-off expenses in the date range', () => {
    const filter = cardExpenseMonthFilter(start, end);
    expect(filter.OR[0]).toEqual({
      recurrence: 'none',
      date: { gte: start, lte: end },
    });
  });

  it('second branch captures all monthly recurrences', () => {
    const filter = cardExpenseMonthFilter(start, end);
    expect(filter.OR[1]).toEqual({ recurrence: 'monthly' });
  });
});
