import { getActiveContext, getContextFilter, requireAuth } from './context';

const mockAuth = jest.fn();
const mockCookiesGet = jest.fn();
const mockFindUnique = jest.fn();

jest.mock('@/auth', () => ({ auth: (...args: unknown[]) => mockAuth(...args) }));
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => Promise.resolve({ get: mockCookiesGet })),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    houseMember: { findUnique: (...args: unknown[]) => mockFindUnique(...args) },
  },
}));

beforeEach(() => jest.clearAllMocks());

// ─── getActiveContext ─────────────────────────────────────────────────────────

describe('getActiveContext', () => {
  it('returns null when there is no session', async () => {
    mockAuth.mockResolvedValue(null);
    expect(await getActiveContext()).toBeNull();
  });

  it('returns null when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} });
    expect(await getActiveContext()).toBeNull();
  });

  it('returns null when the cookie is absent', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });
    mockCookiesGet.mockReturnValue(undefined);
    expect(await getActiveContext()).toBeNull();
  });

  it('returns personal context when cookie is "personal"', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });
    mockCookiesGet.mockReturnValue({ value: 'personal' });

    expect(await getActiveContext()).toEqual({ type: 'personal', userId: 'u1' });
  });

  it('returns house context when cookie is "house:{id}" and user is member', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });
    mockCookiesGet.mockReturnValue({ value: 'house:h1' });
    mockFindUnique.mockResolvedValue({ house: { name: 'Casa da Família' } });

    expect(await getActiveContext()).toEqual({
      type: 'house',
      houseId: 'h1',
      houseName: 'Casa da Família',
    });
  });

  it('returns null when cookie is "house:{id}" but user is not a member', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });
    mockCookiesGet.mockReturnValue({ value: 'house:h1' });
    mockFindUnique.mockResolvedValue(null);

    expect(await getActiveContext()).toBeNull();
  });

  it('returns null when cookie has an unrecognised format', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });
    mockCookiesGet.mockReturnValue({ value: 'unknown-format' });

    expect(await getActiveContext()).toBeNull();
  });
});

// ─── getContextFilter ─────────────────────────────────────────────────────────

describe('getContextFilter', () => {
  it('throws when there is no active context', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(getContextFilter()).rejects.toThrow('Nenhum contexto financeiro ativo.');
  });

  it('returns userId filter for personal context', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });
    mockCookiesGet.mockReturnValue({ value: 'personal' });

    expect(await getContextFilter()).toEqual({ userId: 'u1', houseId: null });
  });

  it('returns houseId filter for house context', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });
    mockCookiesGet.mockReturnValue({ value: 'house:h1' });
    mockFindUnique.mockResolvedValue({ house: { name: 'Casa' } });

    expect(await getContextFilter()).toEqual({ houseId: 'h1', userId: null });
  });
});

// ─── requireAuth ─────────────────────────────────────────────────────────────

describe('requireAuth', () => {
  it('returns userId when authenticated', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });
    expect(await requireAuth()).toBe('u1');
  });

  it('throws when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(requireAuth()).rejects.toThrow('Não autenticado.');
  });

  it('throws when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} });
    await expect(requireAuth()).rejects.toThrow('Não autenticado.');
  });
});
