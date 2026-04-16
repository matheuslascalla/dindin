import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UnifiedExpenseForm } from './UnifiedExpenseForm';
import type { UnifiedExpense } from '@/server/actions/expense';

jest.mock('@/server/actions/expense', () => ({
  createExpense: jest.fn(),
  updateExpense: jest.fn(),
}));
jest.mock('@/server/actions/card', () => ({
  createCardExpense: jest.fn(),
  updateCardExpense: jest.fn(),
}));
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

const categories = [{ id: 'cat-1', name: 'Alimentação', color: '#6B7280', subcategories: [] }];
const cards = [{ id: 'card-1', name: 'Nubank' }];
const contextPersons = {
  type: 'personal' as const,
  user: { id: 'user-1', name: 'João', image: null },
};

const baseProps = {
  categories,
  cards,
  contextPersons,
  onSuccess: jest.fn(),
  onCancel: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

describe('UnifiedExpenseForm', () => {
  it('renders create mode with payment method selector', () => {
    render(<UnifiedExpenseForm {...baseProps} />);
    expect(screen.getByText('Meio de pagamento')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /criar/i })).toBeInTheDocument();
  });

  it('renders PIX, Dinheiro, Cartão options', () => {
    render(<UnifiedExpenseForm {...baseProps} />);
    expect(screen.getByRole('button', { name: /^pix$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dinheiro/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cartão/i })).toBeInTheDocument();
  });

  it('switches to CARD mode when Cartão is clicked and shows card selector', () => {
    render(<UnifiedExpenseForm {...baseProps} />);
    const comboboxesBefore = screen.getAllByRole('combobox').length;
    fireEvent.click(screen.getByRole('button', { name: /cartão/i }));
    // Card selector is added alongside the existing category selector
    expect(screen.getAllByRole('combobox').length).toBeGreaterThan(comboboxesBefore);
  });

  it('shows card type options (Avulso, Recorrente, Parcelado) in CARD mode', () => {
    render(<UnifiedExpenseForm {...baseProps} />);
    fireEvent.click(screen.getByRole('button', { name: /cartão/i }));
    expect(screen.getByRole('button', { name: /avulso/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /recorrente mensal/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /parcelado/i })).toBeInTheDocument();
  });

  it('shows installment count field when Parcelado is selected', () => {
    render(<UnifiedExpenseForm {...baseProps} />);
    fireEvent.click(screen.getByRole('button', { name: /cartão/i }));
    fireEvent.click(screen.getByRole('button', { name: /parcelado/i }));
    expect(screen.getByText('Número de parcelas')).toBeInTheDocument();
  });

  it('shows installment value hint when value and count are set', () => {
    render(<UnifiedExpenseForm {...baseProps} />);
    fireEvent.click(screen.getByRole('button', { name: /cartão/i }));
    fireEvent.click(screen.getByRole('button', { name: /parcelado/i }));
    fireEvent.change(screen.getByPlaceholderText('0,00'), { target: { value: '100' } });
    expect(screen.getByText(/valor por parcela/i)).toBeInTheDocument();
  });

  it('shows monthly recurrence info when Recorrente Mensal is selected', () => {
    render(<UnifiedExpenseForm {...baseProps} />);
    fireEvent.click(screen.getByRole('button', { name: /cartão/i }));
    fireEvent.click(screen.getByRole('button', { name: /recorrente mensal/i }));
    expect(screen.getByText(/aparecerá automaticamente/i)).toBeInTheDocument();
  });

  it('shows validation error when submitting with zero value', () => {
    const { container } = render(<UnifiedExpenseForm {...baseProps} />);
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);
    expect(screen.getByText('Valor deve ser maior que zero.')).toBeInTheDocument();
  });

  it('calls createExpense (PIX) on valid submit', async () => {
    const { createExpense } = jest.requireMock('@/server/actions/expense');
    const { container } = render(<UnifiedExpenseForm {...baseProps} />);
    fireEvent.change(screen.getByPlaceholderText('Ex: Conta de luz'), { target: { value: 'Luz' } });
    fireEvent.change(screen.getByPlaceholderText('0,00'), { target: { value: '50' } });
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);
    await waitFor(() => expect(createExpense).toHaveBeenCalled());
  });

  it('calls createCardExpense on valid submit in CARD mode', async () => {
    const { createCardExpense } = jest.requireMock('@/server/actions/card');
    const { container } = render(<UnifiedExpenseForm {...baseProps} />);
    fireEvent.click(screen.getByRole('button', { name: /cartão/i }));
    fireEvent.change(screen.getByPlaceholderText('Ex: Conta de luz'), {
      target: { value: 'Netflix' },
    });
    fireEvent.change(screen.getByPlaceholderText('0,00'), { target: { value: '40' } });
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);
    await waitFor(() => expect(createCardExpense).toHaveBeenCalled());
  });

  it('calls onCancel when cancel is clicked', () => {
    const onCancel = jest.fn();
    render(<UnifiedExpenseForm {...baseProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('renders edit mode for a regular expense', () => {
    const initial: UnifiedExpense = {
      id: 'exp-1',
      name: 'Luz',
      value: 80,
      date: new Date('2024-03-15'),
      description: null,
      person: null,
      expenseType: { id: 'cat-1', name: 'Alimentação', color: '#6B7280', icon: 'Zap' },
      source: 'expense',
      paymentMethod: 'PIX',
    };
    render(<UnifiedExpenseForm {...baseProps} initial={initial} />);
    expect(screen.getByDisplayValue('Luz')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /salvar/i })).toBeInTheDocument();
  });

  it('renders edit mode for a card expense', () => {
    const initial: UnifiedExpense = {
      id: 'ce-1',
      name: 'Netflix',
      value: 40,
      date: new Date('2024-03-20'),
      description: null,
      person: null,
      expenseType: { id: 'cat-1', name: 'Entretenimento', color: '#8B5CF6', icon: 'Play' },
      source: 'card',
      cardId: 'card-1',
      cardName: 'Nubank',
    };
    render(<UnifiedExpenseForm {...baseProps} initial={initial} />);
    expect(screen.getByDisplayValue('Netflix')).toBeInTheDocument();
  });

  it('shows notice when no cards are available', () => {
    render(<UnifiedExpenseForm {...baseProps} cards={[]} />);
    expect(screen.getByText(/cadastre um cartão na página de Cartões/i)).toBeInTheDocument();
  });
});
