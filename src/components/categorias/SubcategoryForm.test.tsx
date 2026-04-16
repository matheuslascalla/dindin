import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubcategoryForm } from './SubcategoryForm';

jest.mock('@/server/actions/subcategory', () => ({
  createSubcategory: jest.fn(),
  updateSubcategory: jest.fn(),
}));

import { createSubcategory, updateSubcategory } from '@/server/actions/subcategory';

const mockCreate = createSubcategory as jest.Mock;
const mockUpdate = updateSubcategory as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('SubcategoryForm — create mode', () => {
  it('renders Criar button and empty name field', () => {
    render(<SubcategoryForm expenseTypeId="cat-1" onSuccess={jest.fn()} onCancel={jest.fn()} />);

    expect(screen.getByRole('button', { name: /criar/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/delivery/i)).toHaveValue('');
  });

  it('calls createSubcategory with name and expenseTypeId on submit', async () => {
    mockCreate.mockResolvedValue({});
    const onSuccess = jest.fn();

    render(<SubcategoryForm expenseTypeId="cat-1" onSuccess={onSuccess} onCancel={jest.fn()} />);

    await userEvent.type(screen.getByPlaceholderText(/delivery/i), 'Supermercado');
    await userEvent.click(screen.getByRole('button', { name: /criar/i }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({ name: 'Supermercado', expenseTypeId: 'cat-1' });
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it('shows server error when createSubcategory throws', async () => {
    mockCreate.mockRejectedValue(new Error('Já existe uma sub-categoria com este nome'));

    render(<SubcategoryForm expenseTypeId="cat-1" onSuccess={jest.fn()} onCancel={jest.fn()} />);

    await userEvent.type(screen.getByPlaceholderText(/delivery/i), 'Teste');
    await userEvent.click(screen.getByRole('button', { name: /criar/i }));

    await waitFor(() => {
      expect(screen.getByText('Já existe uma sub-categoria com este nome')).toBeInTheDocument();
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const onCancel = jest.fn();
    render(<SubcategoryForm expenseTypeId="cat-1" onSuccess={jest.fn()} onCancel={onCancel} />);

    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(onCancel).toHaveBeenCalled();
  });
});

describe('SubcategoryForm — edit mode', () => {
  const initial = { id: 'sub-1', name: 'Delivery' };

  it('pre-fills the name field and shows Salvar button', () => {
    render(
      <SubcategoryForm
        expenseTypeId="cat-1"
        initial={initial}
        onSuccess={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByPlaceholderText(/delivery/i)).toHaveValue('Delivery');
    expect(screen.getByRole('button', { name: /salvar/i })).toBeInTheDocument();
  });

  it('calls updateSubcategory (not createSubcategory) on submit', async () => {
    mockUpdate.mockResolvedValue({});
    const onSuccess = jest.fn();

    render(
      <SubcategoryForm
        expenseTypeId="cat-1"
        initial={initial}
        onSuccess={onSuccess}
        onCancel={jest.fn()}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith('sub-1', { name: 'Delivery' });
    });
    expect(mockCreate).not.toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
  });

  it('shows server error when updateSubcategory throws', async () => {
    mockUpdate.mockRejectedValue(new Error('Erro ao salvar'));

    render(
      <SubcategoryForm
        expenseTypeId="cat-1"
        initial={initial}
        onSuccess={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(screen.getByText('Erro ao salvar')).toBeInTheDocument();
    });
  });
});
