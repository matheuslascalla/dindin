import { render, screen, fireEvent } from '@testing-library/react';
import { ExpenseFilters } from './ExpenseFilters';

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: pushMock })),
  usePathname: jest.fn(() => '/gastos'),
  useSearchParams: jest.fn(() => ({ toString: () => 'month=2024-03-01' })),
}));

const categories = [
  { id: 'cat-1', name: 'Alimentação', color: '#6B7280' },
  { id: 'cat-2', name: 'Transporte', color: '#3B82F6' },
];

const personalContext = {
  type: 'personal' as const,
  user: { id: 'user-1', name: 'João', image: null },
};

const houseContext = {
  type: 'house' as const,
  houseId: 'house-1',
  members: [
    { id: 'user-1', name: 'João', image: null },
    { id: 'user-2', name: 'Maria', image: null },
  ],
};

beforeEach(() => pushMock.mockClear());

describe('ExpenseFilters', () => {
  it('renders filter toggle button', () => {
    render(
      <ExpenseFilters
        categories={categories}
        contextPersons={personalContext}
        currentFilters={{}}
      />
    );
    expect(screen.getByRole('button', { name: /filtros/i })).toBeInTheDocument();
  });

  it('does not show filter panel by default when no active filters', () => {
    render(
      <ExpenseFilters
        categories={categories}
        contextPersons={personalContext}
        currentFilters={{}}
      />
    );
    expect(screen.queryByText('Meio de pagamento')).not.toBeInTheDocument();
  });

  it('shows filter panel when toggle is clicked', () => {
    render(
      <ExpenseFilters
        categories={categories}
        contextPersons={personalContext}
        currentFilters={{}}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /filtros/i }));
    expect(screen.getByText('Meio de pagamento')).toBeInTheDocument();
  });

  it('shows filter panel open when filters are active', () => {
    render(
      <ExpenseFilters
        categories={categories}
        contextPersons={personalContext}
        currentFilters={{ paymentMethod: 'PIX' }}
      />
    );
    expect(screen.getByText('Meio de pagamento')).toBeInTheDocument();
  });

  it('shows active filter count badge', () => {
    render(
      <ExpenseFilters
        categories={categories}
        contextPersons={personalContext}
        currentFilters={{ paymentMethod: 'PIX', categoryId: 'cat-1' }}
      />
    );
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows "Limpar filtros" button when filters are active', () => {
    render(
      <ExpenseFilters
        categories={categories}
        contextPersons={personalContext}
        currentFilters={{ paymentMethod: 'CARD' }}
      />
    );
    expect(screen.getByRole('button', { name: /limpar filtros/i })).toBeInTheDocument();
  });

  it('calls router.push with cleared filters on "Limpar filtros" click', () => {
    render(
      <ExpenseFilters
        categories={categories}
        contextPersons={personalContext}
        currentFilters={{ paymentMethod: 'PIX', categoryId: 'cat-1' }}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /limpar filtros/i }));
    expect(pushMock).toHaveBeenCalledWith(expect.stringContaining('/gastos?'));
    const url = pushMock.mock.calls[0][0] as string;
    expect(url).not.toContain('paymentMethod');
    expect(url).not.toContain('categoryId');
  });

  it('calls router.push with selected payment method', () => {
    render(
      <ExpenseFilters
        categories={categories}
        contextPersons={personalContext}
        currentFilters={{}}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /filtros/i }));
    fireEvent.click(screen.getByRole('button', { name: /^pix$/i }));
    expect(pushMock).toHaveBeenCalledWith(expect.stringContaining('paymentMethod=PIX'));
  });

  it('toggles payment method off when clicking the active one', () => {
    render(
      <ExpenseFilters
        categories={categories}
        contextPersons={personalContext}
        currentFilters={{ paymentMethod: 'PIX' }}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /^pix$/i }));
    const url = pushMock.mock.calls[0][0] as string;
    expect(url).not.toContain('paymentMethod=PIX');
  });

  it('shows person filter in house context', () => {
    render(
      <ExpenseFilters categories={categories} contextPersons={houseContext} currentFilters={{}} />
    );
    fireEvent.click(screen.getByRole('button', { name: /filtros/i }));
    expect(screen.getByText('Pessoa')).toBeInTheDocument();
  });

  it('does not show person filter in personal context', () => {
    render(
      <ExpenseFilters
        categories={categories}
        contextPersons={personalContext}
        currentFilters={{}}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /filtros/i }));
    expect(screen.queryByText('Pessoa')).not.toBeInTheDocument();
  });
});
