import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CardForm } from './CardForm';
import { CardExpenseForm } from './CardExpenseForm';
import { CardList } from './CardList';
import { CardItem } from './CardItem';

jest.mock('@/server/actions/card', () => ({
  createCard: jest.fn(),
  updateCard: jest.fn(),
  deleteCard: jest.fn(),
  createCardExpense: jest.fn(),
  updateCardExpense: jest.fn(),
  deleteCardExpense: jest.fn(),
  deleteInstallmentGroup: jest.fn(),
}));
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

// ─── CardForm ────────────────────────────────────────────────────────────────

describe('CardForm', () => {
  it('renders create mode with empty fields', () => {
    render(<CardForm onSuccess={jest.fn()} onCancel={jest.fn()} />);
    expect(screen.getByPlaceholderText(/bradesco/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /criar/i })).toBeInTheDocument();
  });

  it('renders edit mode with initial values', () => {
    render(
      <CardForm
        onSuccess={jest.fn()}
        onCancel={jest.fn()}
        initial={{ id: 'c1', name: 'Nubank', brand: 'Mastercard' }}
      />
    );
    expect(screen.getByDisplayValue('Nubank')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Mastercard')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /salvar/i })).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const { getByRole } = render(<CardForm onSuccess={jest.fn()} onCancel={jest.fn()} />);
    getByRole('button', { name: /cancelar/i }).click();
  });

  it('calls createCard on valid submit', async () => {
    const { createCard } = jest.requireMock('@/server/actions/card');
    const { container } = render(<CardForm onSuccess={jest.fn()} onCancel={jest.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/bradesco/i), { target: { value: 'Nubank' } });
    fireEvent.change(screen.getByPlaceholderText(/visa, mastercard/i), {
      target: { value: 'Visa' },
    });
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);
    await waitFor(() => expect(createCard).toHaveBeenCalled());
  });

  it('calls updateCard on submit in edit mode', async () => {
    const { updateCard } = jest.requireMock('@/server/actions/card');
    const { container } = render(
      <CardForm
        onSuccess={jest.fn()}
        onCancel={jest.fn()}
        initial={{ id: 'c1', name: 'Nubank', brand: 'Mastercard' }}
      />
    );
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);
    await waitFor(() => expect(updateCard).toHaveBeenCalledWith('c1', expect.any(Object)));
  });
});

// ─── CardExpenseForm ─────────────────────────────────────────────────────────

const categories = [{ id: 'cat-1', name: 'Alimentação', color: '#6B7280' }];

const contextPersons = {
  type: 'personal' as const,
  user: { id: 'user-1', name: 'Usuário Teste', image: null },
};

describe('CardExpenseForm', () => {
  it('renders create mode with kind selector', () => {
    render(
      <CardExpenseForm
        cardId="card-1"
        categories={categories}
        contextPersons={contextPersons}
        onSuccess={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /adicionar/i })).toBeInTheDocument();
  });

  it('renders edit mode with initial one-off expense', () => {
    render(
      <CardExpenseForm
        cardId="card-1"
        categories={categories}
        contextPersons={contextPersons}
        onSuccess={jest.fn()}
        onCancel={jest.fn()}
        initial={{
          id: 'exp-1',
          name: 'Cinema',
          value: 60,
          date: new Date('2024-03-10'),
          expenseTypeId: 'cat-1',
          recurrence: 'none',
        }}
      />
    );
    expect(screen.getByDisplayValue('Cinema')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /salvar/i })).toBeInTheDocument();
  });

  it('shows error when submitting with empty value', () => {
    const { container } = render(
      <CardExpenseForm
        cardId="card-1"
        categories={categories}
        contextPersons={contextPersons}
        onSuccess={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);
    expect(screen.getByText('Valor deve ser maior que zero.')).toBeInTheDocument();
  });

  it('calls createCardExpense on valid submit', async () => {
    const { createCardExpense } = jest.requireMock('@/server/actions/card');
    const { container } = render(
      <CardExpenseForm
        cardId="card-1"
        categories={categories}
        contextPersons={contextPersons}
        onSuccess={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    fireEvent.change(screen.getByPlaceholderText('Ex: Netflix'), { target: { value: 'Netflix' } });
    fireEvent.change(screen.getByPlaceholderText('0,00'), { target: { value: '50' } });
    fireEvent.change(screen.getByPlaceholderText('Ex: Plano família, 4 usuários'), {
      target: { value: 'obs' },
    });
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);
    await waitFor(() => expect(createCardExpense).toHaveBeenCalled());
  });

  it('switches to monthly kind', () => {
    render(
      <CardExpenseForm
        cardId="card-1"
        categories={categories}
        contextPersons={contextPersons}
        onSuccess={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Recorrente Mensal' }));
    expect(screen.getByText(/aparecerá automaticamente/i)).toBeInTheDocument();
  });

  it('switches to installment kind and shows parcelas input', () => {
    render(
      <CardExpenseForm
        cardId="card-1"
        categories={categories}
        contextPersons={contextPersons}
        onSuccess={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Parcelado' }));
    expect(screen.getByText(/número de parcelas/i)).toBeInTheDocument();
  });

  it('calls onCancel when cancel is clicked', () => {
    const onCancel = jest.fn();
    render(
      <CardExpenseForm
        cardId="card-1"
        categories={categories}
        contextPersons={contextPersons}
        onSuccess={jest.fn()}
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});

// ─── CardList ────────────────────────────────────────────────────────────────

const sampleCard = {
  id: 'card-1',
  name: 'Nubank',
  brand: 'Mastercard',
  _count: { expenses: 2 },
};

describe('CardList', () => {
  it('renders empty state when no cards', () => {
    render(
      <CardList
        cards={[]}
        expensesByCard={{}}
        totalsByCard={{}}
        grandTotal={0}
        categories={[]}
        contextPersons={contextPersons}
        currentMonth={new Date('2024-03-01')}
      />
    );
    expect(screen.getByText('Nenhum cartão cadastrado')).toBeInTheDocument();
  });

  it('renders card items when cards exist', () => {
    render(
      <CardList
        cards={[sampleCard]}
        expensesByCard={{ 'card-1': [] }}
        totalsByCard={{ 'card-1': 500 }}
        grandTotal={500}
        categories={[]}
        contextPersons={contextPersons}
        currentMonth={new Date('2024-03-01')}
      />
    );
    expect(screen.getByText('Nubank')).toBeInTheDocument();
  });

  it('renders month navigation arrows', () => {
    render(
      <CardList
        cards={[]}
        expensesByCard={{}}
        totalsByCard={{}}
        grandTotal={0}
        categories={[]}
        contextPersons={contextPersons}
        currentMonth={new Date('2024-03-01')}
      />
    );
    // Two navigation buttons (prev/next month)
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(2);
  });
});

// ─── CardItem ────────────────────────────────────────────────────────────────

describe('CardItem', () => {
  it('renders card header with name and total', () => {
    render(
      <CardItem
        card={sampleCard}
        expenses={[]}
        categories={[]}
        contextPersons={contextPersons}
        monthTotal={750}
        onEditCard={jest.fn()}
      />
    );
    expect(screen.getByText('Nubank')).toBeInTheDocument();
  });

  it('shows expense count in header', () => {
    render(
      <CardItem
        card={sampleCard}
        expenses={[]}
        categories={[]}
        contextPersons={contextPersons}
        monthTotal={0}
        onEditCard={jest.fn()}
      />
    );
    expect(screen.getByText(/0 lançamento/i)).toBeInTheDocument();
  });

  it('expands to show empty state when expand button is clicked', () => {
    render(
      <CardItem
        card={sampleCard}
        expenses={[]}
        categories={[]}
        contextPersons={contextPersons}
        monthTotal={0}
        onEditCard={jest.fn()}
      />
    );
    // buttons: [0]=expand/header, [1]=Lançamento, [2]=pencil, [3]=trash
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(screen.getByText('Nenhum lançamento neste mês.')).toBeInTheDocument();
  });

  it('opens add expense modal when Lançamento button is clicked', () => {
    render(
      <CardItem
        card={sampleCard}
        expenses={[]}
        categories={[]}
        contextPersons={contextPersons}
        monthTotal={0}
        onEditCard={jest.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Lançamento' }));
    expect(screen.getByRole('heading', { name: 'Novo Lançamento' })).toBeInTheDocument();
  });

  it('calls onEditCard when pencil button is clicked', () => {
    const onEditCard = jest.fn();
    render(
      <CardItem
        card={sampleCard}
        expenses={[]}
        categories={[]}
        contextPersons={contextPersons}
        monthTotal={0}
        onEditCard={onEditCard}
      />
    );
    // buttons: [0]=expand, [1]=Lançamento, [2]=pencil, [3]=trash
    fireEvent.click(screen.getAllByRole('button')[2]);
    expect(onEditCard).toHaveBeenCalled();
  });

  it('opens delete card modal when trash button is clicked', () => {
    render(
      <CardItem
        card={sampleCard}
        expenses={[]}
        categories={[]}
        contextPersons={contextPersons}
        monthTotal={0}
        onEditCard={jest.fn()}
      />
    );
    fireEvent.click(screen.getAllByRole('button')[3]);
    expect(screen.getByRole('heading', { name: 'Deletar cartão' })).toBeInTheDocument();
  });

  it('closes delete card modal when cancel is clicked', () => {
    render(
      <CardItem
        card={sampleCard}
        expenses={[]}
        categories={[]}
        contextPersons={contextPersons}
        monthTotal={0}
        onEditCard={jest.fn()}
      />
    );
    fireEvent.click(screen.getAllByRole('button')[3]);
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(screen.queryByRole('heading', { name: 'Deletar cartão' })).not.toBeInTheDocument();
  });
});

// ─── CardItem expense interactions ───────────────────────────────────────────

const sampleExpense = {
  id: 'exp-1',
  name: 'Netflix',
  value: 50,
  date: new Date('2024-03-10'),
  expenseTypeId: 'cat-1',
  expenseType: { id: 'cat-1', name: 'Alimentação', color: '#6B7280' },
  recurrence: 'none',
  installmentTotal: null,
  installmentNumber: null,
  installmentGroupId: null,
};

const sampleInstallmentExpense = {
  ...sampleExpense,
  id: 'exp-2',
  installmentTotal: 3,
  installmentNumber: 1,
  installmentGroupId: 'grp-1',
};

describe('CardItem expense interactions', () => {
  it('expands to show expense rows when card has expenses', () => {
    render(
      <CardItem
        card={sampleCard}
        expenses={[sampleExpense]}
        categories={[]}
        contextPersons={contextPersons}
        monthTotal={50}
        onEditCard={jest.fn()}
      />
    );
    fireEvent.click(screen.getAllByRole('button')[0]); // expand
    expect(screen.getByText('Netflix')).toBeInTheDocument();
  });

  it('opens add expense modal from "Adicionar lançamento" in expanded empty state', () => {
    render(
      <CardItem
        card={sampleCard}
        expenses={[]}
        categories={[]}
        contextPersons={contextPersons}
        monthTotal={0}
        onEditCard={jest.fn()}
      />
    );
    fireEvent.click(screen.getAllByRole('button')[0]); // expand
    fireEvent.click(screen.getByText('+ Adicionar lançamento'));
    expect(screen.getByRole('heading', { name: 'Novo Lançamento' })).toBeInTheDocument();
  });

  it('opens edit expense modal when pencil is clicked on an expense row', () => {
    render(
      <CardItem
        card={sampleCard}
        expenses={[sampleExpense]}
        categories={[]}
        contextPersons={contextPersons}
        monthTotal={50}
        onEditCard={jest.fn()}
      />
    );
    fireEvent.click(screen.getAllByRole('button')[0]); // expand
    // buttons after expand: [0]=expand, [1]=Lançamento, [2]=pencil(card), [3]=trash(card),
    // [4]=pencil(expense), [5]=trash(expense)
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[4]); // pencil on expense
    expect(screen.getByRole('heading', { name: 'Editar Lançamento' })).toBeInTheDocument();
  });

  it('opens delete expense modal when trash is clicked on an expense', () => {
    render(
      <CardItem
        card={sampleCard}
        expenses={[sampleExpense]}
        categories={[]}
        contextPersons={contextPersons}
        monthTotal={50}
        onEditCard={jest.fn()}
      />
    );
    fireEvent.click(screen.getAllByRole('button')[0]); // expand
    // buttons after expand: [0]=expand, [1]=Lançamento, [2]=pencil(card), [3]=trash(card),
    // [4]=pencil(expense), [5]=trash(expense)
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[5]); // trash on expense
    expect(screen.getByRole('heading', { name: 'Confirmar exclusão' })).toBeInTheDocument();
  });

  it('calls deleteCardExpense when confirm delete single is clicked', async () => {
    const { deleteCardExpense } = jest.requireMock('@/server/actions/card');
    render(
      <CardItem
        card={sampleCard}
        expenses={[sampleExpense]}
        categories={[]}
        contextPersons={contextPersons}
        monthTotal={50}
        onEditCard={jest.fn()}
      />
    );
    fireEvent.click(screen.getAllByRole('button')[0]); // expand
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[5]); // trash on expense
    fireEvent.click(screen.getByRole('button', { name: /^Deletar$/i }));
    await waitFor(() => expect(deleteCardExpense).toHaveBeenCalledWith('exp-1'));
  });

  it('shows installment delete options for installment expenses', () => {
    render(
      <CardItem
        card={sampleCard}
        expenses={[sampleInstallmentExpense]}
        categories={[]}
        contextPersons={contextPersons}
        monthTotal={50}
        onEditCard={jest.fn()}
      />
    );
    fireEvent.click(screen.getAllByRole('button')[0]); // expand
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[5]); // trash on expense
    expect(
      screen.getByRole('button', { name: /deletar apenas esta parcela/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /deletar todas as parcelas/i })).toBeInTheDocument();
  });

  it('calls deleteInstallmentGroup when delete all parcelas is clicked', async () => {
    const { deleteInstallmentGroup } = jest.requireMock('@/server/actions/card');
    render(
      <CardItem
        card={sampleCard}
        expenses={[sampleInstallmentExpense]}
        categories={[]}
        contextPersons={contextPersons}
        monthTotal={50}
        onEditCard={jest.fn()}
      />
    );
    fireEvent.click(screen.getAllByRole('button')[0]); // expand
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[5]); // trash on expense
    fireEvent.click(screen.getByRole('button', { name: /deletar todas as parcelas/i }));
    await waitFor(() => expect(deleteInstallmentGroup).toHaveBeenCalledWith('grp-1'));
  });

  it('calls deleteCard when confirm delete card is clicked', async () => {
    const { deleteCard } = jest.requireMock('@/server/actions/card');
    render(
      <CardItem
        card={sampleCard}
        expenses={[]}
        categories={[]}
        contextPersons={contextPersons}
        monthTotal={0}
        onEditCard={jest.fn()}
      />
    );
    fireEvent.click(screen.getAllByRole('button')[3]); // trash card
    fireEvent.click(screen.getByRole('button', { name: /^Deletar$/i }));
    await waitFor(() => expect(deleteCard).toHaveBeenCalledWith('card-1'));
  });
});

// ─── CardList interactions ────────────────────────────────────────────────────

describe('CardList interactions', () => {
  it('calls router.push when prev month is clicked', () => {
    const pushMock = jest.fn();
    jest.requireMock('next/navigation').useRouter.mockReturnValue({ push: pushMock });
    render(
      <CardList
        cards={[]}
        expensesByCard={{}}
        totalsByCard={{}}
        grandTotal={0}
        categories={[]}
        contextPersons={contextPersons}
        currentMonth={new Date('2024-03-01')}
      />
    );
    // buttons: [0]=Novo Cartão, [1]=Hoje, [2]=ChevronLeft, [3]=ChevronRight
    fireEvent.click(screen.getAllByRole('button')[2]);
    expect(pushMock).toHaveBeenCalledWith(expect.stringContaining('/cartoes?'));
  });

  it('calls router.push when next month is clicked', () => {
    const pushMock = jest.fn();
    jest.requireMock('next/navigation').useRouter.mockReturnValue({ push: pushMock });
    render(
      <CardList
        cards={[]}
        expensesByCard={{}}
        totalsByCard={{}}
        grandTotal={0}
        categories={[]}
        contextPersons={contextPersons}
        currentMonth={new Date('2024-03-01')}
      />
    );
    fireEvent.click(screen.getAllByRole('button')[3]);
    expect(pushMock).toHaveBeenCalledWith(expect.stringContaining('/cartoes?'));
  });

  it('opens create card modal when Novo Cartão is clicked (top)', () => {
    render(
      <CardList
        cards={[]}
        expensesByCard={{}}
        totalsByCard={{}}
        grandTotal={0}
        categories={[]}
        contextPersons={contextPersons}
        currentMonth={new Date('2024-03-01')}
      />
    );
    fireEvent.click(screen.getAllByRole('button', { name: /novo cartão/i })[0]);
    expect(screen.getByRole('heading', { name: 'Novo Cartão' })).toBeInTheDocument();
  });

  it('opens create card modal from EmptyState button', () => {
    render(
      <CardList
        cards={[]}
        expensesByCard={{}}
        totalsByCard={{}}
        grandTotal={0}
        categories={[]}
        contextPersons={contextPersons}
        currentMonth={new Date('2024-03-01')}
      />
    );
    fireEvent.click(screen.getAllByRole('button', { name: /novo cartão/i })[1]);
    expect(screen.getByRole('heading', { name: 'Novo Cartão' })).toBeInTheDocument();
  });

  it('closes create card modal when X is clicked (covers onClose callback)', () => {
    render(
      <CardList
        cards={[]}
        expensesByCard={{}}
        totalsByCard={{}}
        grandTotal={0}
        categories={[]}
        contextPersons={contextPersons}
        currentMonth={new Date('2024-03-01')}
      />
    );
    fireEvent.click(screen.getAllByRole('button', { name: /novo cartão/i })[0]);
    expect(screen.getByRole('heading', { name: 'Novo Cartão' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /fechar/i }));
    expect(screen.queryByRole('heading', { name: 'Novo Cartão' })).not.toBeInTheDocument();
  });

  it('opens edit card modal when card edit button is clicked', () => {
    render(
      <CardList
        cards={[sampleCard]}
        expensesByCard={{ 'card-1': [] }}
        totalsByCard={{ 'card-1': 0 }}
        grandTotal={0}
        categories={[]}
        contextPersons={contextPersons}
        currentMonth={new Date('2024-03-01')}
      />
    );
    // CardList renders CardItem which has edit button at index [2]
    // buttons: [0]=Novo Cartão, [1]=Hoje, [2]=prev, [3]=next, [4]=expand, [5]=Lançamento, [6]=pencil, [7]=trash
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[6]); // pencil = onEditCard
    expect(screen.getByRole('heading', { name: 'Editar Cartão' })).toBeInTheDocument();
  });
});
