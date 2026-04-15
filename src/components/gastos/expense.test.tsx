import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExpenseForm } from './ExpenseForm';
import { ExpenseList } from './ExpenseList';

jest.mock('@/server/actions/expense', () => ({
  createExpense: jest.fn(),
  updateExpense: jest.fn(),
  deleteExpense: jest.fn(),
}));
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

const categories = [{ id: 'cat-1', name: 'Alimentação', color: '#6B7280' }];

// ─── ExpenseForm ─────────────────────────────────────────────────────────────

describe('ExpenseForm', () => {
  it('renders create mode', () => {
    render(<ExpenseForm categories={categories} onSuccess={jest.fn()} onCancel={jest.fn()} />);
    expect(screen.getByRole('button', { name: /criar/i })).toBeInTheDocument();
  });

  it('renders edit mode with initial values', () => {
    render(
      <ExpenseForm
        categories={categories}
        onSuccess={jest.fn()}
        onCancel={jest.fn()}
        initial={{
          id: 'exp-1',
          name: 'Mercado',
          value: 150,
          date: new Date('2024-03-15'),
          expenseTypeId: 'cat-1',
        }}
      />
    );
    expect(screen.getByDisplayValue('Mercado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /salvar/i })).toBeInTheDocument();
  });

  it('shows error when submitting with empty value', () => {
    const { container } = render(
      <ExpenseForm categories={categories} onSuccess={jest.fn()} onCancel={jest.fn()} />
    );
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);
    expect(screen.getByText('Valor deve ser maior que zero.')).toBeInTheDocument();
  });

  it('calls createExpense on valid submit', async () => {
    const { createExpense } = jest.requireMock('@/server/actions/expense');
    const { container } = render(
      <ExpenseForm categories={categories} onSuccess={jest.fn()} onCancel={jest.fn()} />
    );
    fireEvent.change(screen.getByPlaceholderText('Ex: Conta de luz'), { target: { value: 'Luz' } });
    fireEvent.change(screen.getByPlaceholderText('0,00'), { target: { value: '150' } });
    fireEvent.change(screen.getByPlaceholderText('Ex: João'), { target: { value: 'Maria' } });
    fireEvent.change(screen.getByPlaceholderText('Observações...'), { target: { value: 'obs' } });
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);
    await waitFor(() => expect(createExpense).toHaveBeenCalled());
  });

  it('calls onCancel when cancel is clicked', () => {
    const onCancel = jest.fn();
    render(<ExpenseForm categories={categories} onSuccess={jest.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('calls updateExpense on valid submit in edit mode', async () => {
    const { updateExpense } = jest.requireMock('@/server/actions/expense');
    const { container } = render(
      <ExpenseForm
        categories={categories}
        onSuccess={jest.fn()}
        onCancel={jest.fn()}
        initial={{
          id: 'exp-1',
          name: 'Mercado',
          value: 150,
          date: new Date('2024-03-15'),
          expenseTypeId: 'cat-1',
        }}
      />
    );
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);
    await waitFor(() => expect(updateExpense).toHaveBeenCalledWith('exp-1', expect.any(Object)));
  });
});

// ─── ExpenseList ─────────────────────────────────────────────────────────────

const expense = {
  id: 'exp-1',
  name: 'Padaria',
  value: 50,
  date: new Date('2024-03-10'),
  expenseTypeId: 'cat-1',
  expenseType: { id: 'cat-1', name: 'Alimentação', color: '#6B7280' },
  createdAt: new Date(),
};

describe('ExpenseList', () => {
  it('renders empty state when no expenses', () => {
    render(
      <ExpenseList
        expenses={[]}
        categories={categories}
        currentMonth={new Date('2024-03-01')}
        total={0}
      />
    );
    expect(screen.getByText('Nenhum gasto neste mês')).toBeInTheDocument();
  });

  it('renders expense rows when expenses exist', () => {
    render(
      <ExpenseList
        expenses={[expense]}
        categories={categories}
        currentMonth={new Date('2024-03-01')}
        total={50}
      />
    );
    expect(screen.getByText('Padaria')).toBeInTheDocument();
  });

  it('renders month navigation arrows', () => {
    render(
      <ExpenseList
        expenses={[]}
        categories={categories}
        currentMonth={new Date('2024-03-01')}
        total={0}
      />
    );
    // Two navigation buttons (prev/next month)
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(2);
  });

  it('calls router.push when prev month is clicked', () => {
    const pushMock = jest.fn();
    jest.requireMock('next/navigation').useRouter.mockReturnValue({ push: pushMock });
    render(
      <ExpenseList
        expenses={[]}
        categories={categories}
        currentMonth={new Date('2024-03-01')}
        total={0}
      />
    );
    // buttons: [0]=Novo Gasto, [1]=ChevronLeft, [2]=ChevronRight, [3]=Novo Gasto (empty state)
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]);
    expect(pushMock).toHaveBeenCalledWith(expect.stringContaining('/gastos?'));
  });

  it('calls router.push when next month is clicked', () => {
    const pushMock = jest.fn();
    jest.requireMock('next/navigation').useRouter.mockReturnValue({ push: pushMock });
    render(
      <ExpenseList
        expenses={[]}
        categories={categories}
        currentMonth={new Date('2024-03-01')}
        total={0}
      />
    );
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[2]);
    expect(pushMock).toHaveBeenCalledWith(expect.stringContaining('/gastos?'));
  });

  it('opens delete modal when trash icon is clicked', () => {
    render(
      <ExpenseList
        expenses={[expense]}
        categories={categories}
        currentMonth={new Date('2024-03-01')}
        total={50}
      />
    );
    // buttons: [0]=Novo Gasto, [1]=prev, [2]=next, [3]=pencil, [4]=trash
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[4]);
    expect(screen.getByRole('heading', { name: 'Confirmar exclusão' })).toBeInTheDocument();
  });

  it('opens edit modal when pencil icon is clicked', () => {
    render(
      <ExpenseList
        expenses={[expense]}
        categories={categories}
        currentMonth={new Date('2024-03-01')}
        total={50}
      />
    );
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[3]);
    expect(screen.getByRole('heading', { name: 'Editar Gasto' })).toBeInTheDocument();
  });

  it('opens create modal when Novo Gasto is clicked (top)', () => {
    render(
      <ExpenseList
        expenses={[]}
        categories={categories}
        currentMonth={new Date('2024-03-01')}
        total={0}
      />
    );
    fireEvent.click(screen.getAllByRole('button', { name: /novo gasto/i })[0]);
    expect(screen.getByRole('heading', { name: 'Novo Gasto' })).toBeInTheDocument();
  });

  it('opens create modal from EmptyState button', () => {
    render(
      <ExpenseList
        expenses={[]}
        categories={categories}
        currentMonth={new Date('2024-03-01')}
        total={0}
      />
    );
    // EmptyState renders a second "Novo Gasto" button
    fireEvent.click(screen.getAllByRole('button', { name: /novo gasto/i })[1]);
    expect(screen.getByRole('heading', { name: 'Novo Gasto' })).toBeInTheDocument();
  });

  it('closes delete modal when cancel is clicked', () => {
    render(
      <ExpenseList
        expenses={[expense]}
        categories={categories}
        currentMonth={new Date('2024-03-01')}
        total={50}
      />
    );
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[4]); // open delete modal
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(screen.queryByRole('heading', { name: 'Confirmar exclusão' })).not.toBeInTheDocument();
  });

  it('calls deleteExpense when confirm delete is clicked', async () => {
    const { deleteExpense } = jest.requireMock('@/server/actions/expense');
    render(
      <ExpenseList
        expenses={[expense]}
        categories={categories}
        currentMonth={new Date('2024-03-01')}
        total={50}
      />
    );
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[4]); // trash icon
    fireEvent.click(screen.getByRole('button', { name: /^Deletar$/i }));
    await waitFor(() => expect(deleteExpense).toHaveBeenCalledWith('exp-1'));
  });
});
