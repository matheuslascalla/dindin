import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryForm } from './CategoryForm';

jest.mock('@/server/actions/category', () => ({
  createCategory: jest.fn(),
  updateCategory: jest.fn(),
}));

import { createCategory, updateCategory } from '@/server/actions/category';

const mockCreate = createCategory as jest.Mock;
const mockUpdate = updateCategory as jest.Mock;

const validInitial = {
  id: 'cat-1',
  name: 'Alimentação',
  limitPercent: 20,
  color: '#6B7280',
  icon: 'home',
};

beforeEach(() => jest.clearAllMocks());

describe('CategoryForm — create mode', () => {
  it('calls createCategory on submit with form values', async () => {
    mockCreate.mockResolvedValue({});
    const onSuccess = jest.fn();

    render(<CategoryForm onSuccess={onSuccess} onCancel={jest.fn()} />);

    await userEvent.clear(screen.getByPlaceholderText(/custo fixo/i));
    await userEvent.type(screen.getByPlaceholderText(/custo fixo/i), 'Transporte');
    await userEvent.clear(screen.getByPlaceholderText(/ex: 40/i));
    await userEvent.type(screen.getByPlaceholderText(/ex: 40/i), '15');

    await userEvent.click(screen.getByRole('button', { name: /criar/i }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Transporte', limitPercent: 15 })
      );
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it('shows validation error when limitPercent is empty (NaN)', async () => {
    // Form starts with empty limitPercent — parseFloat('') = NaN → validation fails
    const { container } = render(<CategoryForm onSuccess={jest.fn()} onCancel={jest.fn()} />);

    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    await waitFor(() => {
      expect(screen.getByText(/entre 0.1 e 100/i)).toBeInTheDocument();
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const onCancel = jest.fn();
    render(<CategoryForm onSuccess={jest.fn()} onCancel={onCancel} />);

    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(onCancel).toHaveBeenCalled();
  });
});

describe('CategoryForm — edit mode', () => {
  it('pre-fills form with initial values', () => {
    render(<CategoryForm onSuccess={jest.fn()} onCancel={jest.fn()} initial={validInitial} />);

    expect(screen.getByPlaceholderText(/custo fixo/i)).toHaveValue('Alimentação');
    expect(screen.getByPlaceholderText(/ex: 40/i)).toHaveValue(20);
  });

  it('calls updateCategory (not createCategory) on submit', async () => {
    mockUpdate.mockResolvedValue({});
    const onSuccess = jest.fn();

    render(<CategoryForm onSuccess={onSuccess} onCancel={jest.fn()} initial={validInitial} />);

    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        'cat-1',
        expect.objectContaining({ name: 'Alimentação', limitPercent: 20 })
      );
    });
    expect(mockCreate).not.toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
  });

  it('shows server error message when updateCategory throws', async () => {
    mockUpdate.mockRejectedValue(new Error('Categoria em uso'));

    render(<CategoryForm onSuccess={jest.fn()} onCancel={jest.fn()} initial={validInitial} />);

    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(screen.getByText('Categoria em uso')).toBeInTheDocument();
    });
  });
});
