// jest.mock is hoisted — all factories must be self-contained (no outer-scope vars).

const mockRequireAuth = jest.fn();
const mockRedirect = jest.fn();
const mockRevalidatePath = jest.fn();
const mockCookiesSet = jest.fn();
const mockCookiesDelete = jest.fn();

const mockGetActiveContext = jest.fn();

jest.mock('@/lib/context', () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
  getActiveContext: (...args: unknown[]) => mockGetActiveContext(...args),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    houseMember: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
    house: { create: jest.fn(), findUnique: jest.fn(), delete: jest.fn() },
    user: { findUnique: jest.fn(), findUniqueOrThrow: jest.fn() },
    houseInvite: { findUnique: jest.fn(), upsert: jest.fn(), update: jest.fn() },
    expenseType: { count: jest.fn(), createMany: jest.fn() },
    $transaction: jest.fn(),
  },
}));
jest.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}));
jest.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => Promise.resolve({ set: mockCookiesSet, delete: mockCookiesDelete })),
}));

import {
  setActiveContext,
  listUserContexts,
  getContextPersons,
  createHouse,
  joinHouse,
  inviteToHouse,
  getHouseDetails,
  deleteHouse,
  seedPersonalCategories,
} from './house';
import { prisma } from '@/lib/prisma';

// Typed shorthand so tests stay readable
const db = prisma as unknown as {
  houseMember: jest.Mocked<typeof prisma.houseMember> & { findMany: jest.Mock };
  house: jest.Mocked<typeof prisma.house>;
  user: jest.Mocked<typeof prisma.user> & { findUniqueOrThrow: jest.Mock };
  houseInvite: { findUnique: jest.Mock; upsert: jest.Mock; update: jest.Mock };
  expenseType: { count: jest.Mock; createMany: jest.Mock };
  $transaction: jest.Mock;
};

beforeEach(() => jest.clearAllMocks());

// ─── setActiveContext ─────────────────────────────────────────────────────────

describe('setActiveContext', () => {
  it('sets the cookie and redirects to /dashboard', async () => {
    await setActiveContext('personal');
    expect(mockCookiesSet).toHaveBeenCalledWith('dindin_ctx', 'personal', expect.any(Object));
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
  });

  it('sets a house context cookie', async () => {
    await setActiveContext('house:h1');
    expect(mockCookiesSet).toHaveBeenCalledWith('dindin_ctx', 'house:h1', expect.any(Object));
  });
});

// ─── listUserContexts ─────────────────────────────────────────────────────────

describe('listUserContexts', () => {
  it('returns personal context and house memberships', async () => {
    mockRequireAuth.mockResolvedValue('u1');
    db.houseMember.findMany.mockResolvedValue([
      { house: { id: 'h1', name: 'Casa', inviteCode: 'ABC' }, role: 'owner' },
    ] as never);

    const result = await listUserContexts();

    expect(result.personal).toEqual({ userId: 'u1' });
    expect(result.houses).toHaveLength(1);
    expect(result.houses[0]).toMatchObject({ id: 'h1', role: 'owner' });
  });
});

// ─── getContextPersons ───────────────────────────────────────────────────────

describe('getContextPersons', () => {
  it('throws when there is no active context', async () => {
    mockGetActiveContext.mockResolvedValue(null);
    await expect(getContextPersons()).rejects.toThrow('Nenhum contexto financeiro ativo');
  });

  it('returns personal user when context is personal', async () => {
    mockGetActiveContext.mockResolvedValue({ type: 'personal', userId: 'u1' });
    db.user.findUniqueOrThrow.mockResolvedValue({
      id: 'u1',
      name: 'Matheus',
      image: null,
    } as never);

    const result = await getContextPersons();

    expect(result).toEqual({ type: 'personal', user: { id: 'u1', name: 'Matheus', image: null } });
  });

  it('returns house members when context is house', async () => {
    mockGetActiveContext.mockResolvedValue({
      type: 'house',
      houseId: 'h1',
      houseName: 'Casa',
    });
    db.houseMember.findMany.mockResolvedValue([
      { user: { id: 'u1', name: 'Matheus', image: null } },
      { user: { id: 'u2', name: 'Ana', image: null } },
    ] as never);

    const result = await getContextPersons();

    expect(result).toEqual({
      type: 'house',
      members: [
        { id: 'u1', name: 'Matheus', image: null },
        { id: 'u2', name: 'Ana', image: null },
      ],
    });
  });
});

// ─── createHouse ─────────────────────────────────────────────────────────────

describe('createHouse', () => {
  it('creates a house with default categories', async () => {
    mockRequireAuth.mockResolvedValue('u1');
    (db.house.create as jest.Mock).mockResolvedValue({ id: 'h1', name: 'Casa Nova' });

    const result = await createHouse('Casa Nova');

    expect(db.house.create).toHaveBeenCalled();
    expect(result).toEqual({ id: 'h1', name: 'Casa Nova' });
  });

  it('throws when name is empty', async () => {
    mockRequireAuth.mockResolvedValue('u1');
    await expect(createHouse('')).rejects.toThrow('ao menos 2 caracteres');
  });

  it('throws when name is too short', async () => {
    mockRequireAuth.mockResolvedValue('u1');
    await expect(createHouse('A')).rejects.toThrow('ao menos 2 caracteres');
  });
});

// ─── joinHouse ────────────────────────────────────────────────────────────────

describe('joinHouse', () => {
  it('throws when invite code is invalid', async () => {
    mockRequireAuth.mockResolvedValue('u1');
    (db.house.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(joinHouse('INVALID')).rejects.toThrow('Código de convite inválido');
  });

  it('throws when user is not found', async () => {
    mockRequireAuth.mockResolvedValue('u1');
    (db.house.findUnique as jest.Mock).mockResolvedValue({ id: 'h1' });
    (db.user.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(joinHouse('CODE')).rejects.toThrow('Usuário não encontrado');
  });

  it('runs transaction and joins the house successfully', async () => {
    mockRequireAuth.mockResolvedValue('u1');
    (db.house.findUnique as jest.Mock).mockResolvedValue({ id: 'h1' });
    (db.user.findUnique as jest.Mock).mockResolvedValue({ email: 'a@b.com' });
    db.$transaction.mockResolvedValue(undefined);

    const result = await joinHouse('CODE');

    expect(db.$transaction).toHaveBeenCalled();
    expect(result).toEqual({ id: 'h1' });
  });

  it('throws inside transaction when user is already a member', async () => {
    mockRequireAuth.mockResolvedValue('u1');
    (db.house.findUnique as jest.Mock).mockResolvedValue({ id: 'h1' });
    (db.user.findUnique as jest.Mock).mockResolvedValue({ email: 'a@b.com' });

    db.$transaction.mockImplementation(async (cb: (tx: unknown) => unknown) => {
      const tx = {
        houseMember: { findUnique: jest.fn().mockResolvedValue({ id: 'mem-1' }) },
        houseInvite: { findUnique: jest.fn() },
      };
      return cb(tx);
    });

    await expect(joinHouse('CODE')).rejects.toThrow('Você já é membro dessa casa');
  });

  it('throws inside transaction when there is no pending invite', async () => {
    mockRequireAuth.mockResolvedValue('u1');
    (db.house.findUnique as jest.Mock).mockResolvedValue({ id: 'h1' });
    (db.user.findUnique as jest.Mock).mockResolvedValue({ email: 'a@b.com' });

    db.$transaction.mockImplementation(async (cb: (tx: unknown) => unknown) => {
      const tx = {
        houseMember: { findUnique: jest.fn().mockResolvedValue(null) },
        houseInvite: { findUnique: jest.fn().mockResolvedValue(null) },
      };
      return cb(tx);
    });

    await expect(joinHouse('CODE')).rejects.toThrow('convite pendente');
  });

  it('throws inside transaction when invite has already been used', async () => {
    mockRequireAuth.mockResolvedValue('u1');
    (db.house.findUnique as jest.Mock).mockResolvedValue({ id: 'h1' });
    (db.user.findUnique as jest.Mock).mockResolvedValue({ email: 'a@b.com' });

    db.$transaction.mockImplementation(async (cb: (tx: unknown) => unknown) => {
      const tx = {
        houseMember: { findUnique: jest.fn().mockResolvedValue(null) },
        houseInvite: {
          findUnique: jest.fn().mockResolvedValue({ id: 'inv-1', usedAt: new Date() }),
        },
      };
      return cb(tx);
    });

    await expect(joinHouse('CODE')).rejects.toThrow('convite pendente');
  });
});

// ─── inviteToHouse ────────────────────────────────────────────────────────────

describe('inviteToHouse', () => {
  it('throws when email is invalid', async () => {
    mockRequireAuth.mockResolvedValue('u1');
    await expect(inviteToHouse('h1', 'not-an-email')).rejects.toThrow('e-mail válido');
  });

  it('throws when user is not the owner', async () => {
    mockRequireAuth.mockResolvedValue('u1');
    (db.houseMember.findUnique as jest.Mock).mockResolvedValue({ role: 'member' });

    await expect(inviteToHouse('h1', 'guest@b.com')).rejects.toThrow('dono da casa');
  });

  it('throws when user is not a member', async () => {
    mockRequireAuth.mockResolvedValue('u1');
    (db.houseMember.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(inviteToHouse('h1', 'guest@b.com')).rejects.toThrow('dono da casa');
  });

  it('throws when invited email is already a member', async () => {
    mockRequireAuth.mockResolvedValue('u1');
    (db.houseMember.findUnique as jest.Mock)
      .mockResolvedValueOnce({ role: 'owner' })
      .mockResolvedValueOnce({ id: 'mem-guest' });
    (db.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u2' });

    await expect(inviteToHouse('h1', 'guest@b.com')).rejects.toThrow('já é membro');
  });

  it('creates the invite when invited email has no account yet', async () => {
    mockRequireAuth.mockResolvedValue('u1');
    (db.houseMember.findUnique as jest.Mock).mockResolvedValue({ role: 'owner' });
    (db.user.findUnique as jest.Mock).mockResolvedValue(null);
    db.houseInvite.upsert.mockResolvedValue({ id: 'inv-1' } as never);

    const result = await inviteToHouse('h1', 'new@b.com');

    expect(db.houseInvite.upsert).toHaveBeenCalled();
    expect(result).toEqual({ id: 'inv-1' });
  });

  it('creates the invite when invited email has an account but is not a member', async () => {
    mockRequireAuth.mockResolvedValue('u1');
    (db.houseMember.findUnique as jest.Mock)
      .mockResolvedValueOnce({ role: 'owner' })
      .mockResolvedValueOnce(null);
    (db.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u2' });
    db.houseInvite.upsert.mockResolvedValue({ id: 'inv-2' } as never);

    const result = await inviteToHouse('h1', 'existing@b.com');

    expect(db.houseInvite.upsert).toHaveBeenCalled();
    expect(result).toEqual({ id: 'inv-2' });
  });
});

// ─── getHouseDetails ──────────────────────────────────────────────────────────

describe('getHouseDetails', () => {
  it('throws when user is not a member', async () => {
    mockRequireAuth.mockResolvedValue('u1');
    (db.houseMember.findUnique as jest.Mock).mockResolvedValue(null);
    (db.house.findUnique as jest.Mock).mockResolvedValue({ id: 'h1' });

    await expect(getHouseDetails('h1')).rejects.toThrow('não tem acesso');
  });

  it('returns house details with isOwner=true for owner', async () => {
    mockRequireAuth.mockResolvedValue('u1');
    (db.houseMember.findUnique as jest.Mock).mockResolvedValue({ role: 'owner' });
    (db.house.findUnique as jest.Mock).mockResolvedValue({
      id: 'h1',
      name: 'Casa',
      members: [],
      invites: [],
    });

    const result = await getHouseDetails('h1');

    expect(result).toMatchObject({ id: 'h1', isOwner: true });
  });

  it('returns house details with isOwner=false for member', async () => {
    mockRequireAuth.mockResolvedValue('u1');
    (db.houseMember.findUnique as jest.Mock).mockResolvedValue({ role: 'member' });
    (db.house.findUnique as jest.Mock).mockResolvedValue({
      id: 'h1',
      name: 'Casa',
      members: [],
      invites: [],
    });

    const result = await getHouseDetails('h1');

    expect(result?.isOwner).toBe(false);
  });

  it('returns null when house does not exist', async () => {
    mockRequireAuth.mockResolvedValue('u1');
    (db.houseMember.findUnique as jest.Mock).mockResolvedValue({ role: 'owner' });
    (db.house.findUnique as jest.Mock).mockResolvedValue(null);

    expect(await getHouseDetails('h1')).toBeNull();
  });
});

// ─── deleteHouse ──────────────────────────────────────────────────────────────

describe('deleteHouse', () => {
  it('throws when user is a member but not owner', async () => {
    mockRequireAuth.mockResolvedValue('u1');
    (db.houseMember.findUnique as jest.Mock).mockResolvedValue({ role: 'member' });

    await expect(deleteHouse('h1')).rejects.toThrow('dono da casa');
  });

  it('throws when user is not a member', async () => {
    mockRequireAuth.mockResolvedValue('u1');
    (db.houseMember.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(deleteHouse('h1')).rejects.toThrow('dono da casa');
  });

  it('deletes the house, clears the cookie and redirects', async () => {
    mockRequireAuth.mockResolvedValue('u1');
    (db.houseMember.findUnique as jest.Mock).mockResolvedValue({ role: 'owner' });
    (db.house.delete as jest.Mock).mockResolvedValue(undefined);

    await deleteHouse('h1');

    expect(db.house.delete).toHaveBeenCalledWith({ where: { id: 'h1' } });
    expect(mockCookiesDelete).toHaveBeenCalledWith('dindin_ctx');
    expect(mockRedirect).toHaveBeenCalledWith('/contexto');
  });
});

// ─── seedPersonalCategories ───────────────────────────────────────────────────

describe('seedPersonalCategories', () => {
  it('does nothing when categories already exist', async () => {
    mockRequireAuth.mockResolvedValue('u1');
    db.expenseType.count.mockResolvedValue(3 as never);

    await seedPersonalCategories();

    expect(db.expenseType.createMany).not.toHaveBeenCalled();
  });

  it('seeds 6 default categories when none exist', async () => {
    mockRequireAuth.mockResolvedValue('u1');
    db.expenseType.count.mockResolvedValue(0 as never);
    db.expenseType.createMany.mockResolvedValue({ count: 6 } as never);

    await seedPersonalCategories();

    expect(db.expenseType.createMany).toHaveBeenCalled();
  });
});
