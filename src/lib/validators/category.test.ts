import { CreateCategorySchema, UpdateCategorySchema } from './category';

const validInput = {
  name: 'Alimentação',
  limitPercent: 20,
  color: '#6B7280',
  icon: '🍔',
};

describe('CreateCategorySchema', () => {
  it('accepts a valid input', () => {
    expect(CreateCategorySchema.safeParse(validInput).success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = CreateCategorySchema.safeParse({ ...validInput, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects name longer than 100 characters', () => {
    const result = CreateCategorySchema.safeParse({ ...validInput, name: 'a'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('rejects limitPercent below 0.1', () => {
    const result = CreateCategorySchema.safeParse({ ...validInput, limitPercent: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects limitPercent above 100', () => {
    const result = CreateCategorySchema.safeParse({ ...validInput, limitPercent: 100.1 });
    expect(result.success).toBe(false);
  });

  it('accepts limitPercent at boundary values (0.1 and 100)', () => {
    expect(CreateCategorySchema.safeParse({ ...validInput, limitPercent: 0.1 }).success).toBe(true);
    expect(CreateCategorySchema.safeParse({ ...validInput, limitPercent: 100 }).success).toBe(true);
  });

  it('rejects color without leading #', () => {
    const result = CreateCategorySchema.safeParse({ ...validInput, color: '6B7280' });
    expect(result.success).toBe(false);
  });

  it('rejects color with wrong length', () => {
    const result = CreateCategorySchema.safeParse({ ...validInput, color: '#6B728' });
    expect(result.success).toBe(false);
  });

  it('rejects color with invalid hex characters', () => {
    const result = CreateCategorySchema.safeParse({ ...validInput, color: '#GGGGGG' });
    expect(result.success).toBe(false);
  });

  it('accepts color with lowercase hex digits', () => {
    const result = CreateCategorySchema.safeParse({ ...validInput, color: '#6b7280' });
    expect(result.success).toBe(true);
  });

  it('rejects empty icon', () => {
    const result = CreateCategorySchema.safeParse({ ...validInput, icon: '' });
    expect(result.success).toBe(false);
  });
});

describe('UpdateCategorySchema', () => {
  it('accepts an empty object (all fields optional)', () => {
    expect(UpdateCategorySchema.safeParse({}).success).toBe(true);
  });

  it('accepts partial update with only name', () => {
    expect(UpdateCategorySchema.safeParse({ name: 'Nova Categoria' }).success).toBe(true);
  });

  it('accepts partial update with only color', () => {
    expect(UpdateCategorySchema.safeParse({ color: '#FF0000' }).success).toBe(true);
  });

  it('still validates color format when provided', () => {
    expect(UpdateCategorySchema.safeParse({ color: 'not-a-hex' }).success).toBe(false);
  });
});
