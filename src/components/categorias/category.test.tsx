import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CategoryList } from './CategoryList';

jest.mock('@/server/actions/category', () => ({
  createCategory: jest.fn(),
  updateCategory: jest.fn(),
  deleteCategory: jest.fn(),
}));

const category = {
  id: 'cat-1',
  name: 'Alimentação',
  limitPercent: 20,
  color: '#6B7280',
  icon: 'utensils',
};

describe('CategoryList', () => {
  it('renders empty state when no categories', () => {
    render(<CategoryList categories={[]} />);
    expect(screen.getByText('Nenhuma categoria')).toBeInTheDocument();
  });

  it('renders category rows when categories exist', () => {
    render(<CategoryList categories={[category]} />);
    expect(screen.getByText('Alimentação')).toBeInTheDocument();
    // icon is rendered as an SVG, not as text
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('shows limitPercent value', () => {
    render(<CategoryList categories={[category]} />);
    expect(screen.getByText('20.0%')).toBeInTheDocument();
  });

  it('opens create modal when Nova Categoria button is clicked (top)', () => {
    render(<CategoryList categories={[]} />);
    fireEvent.click(screen.getAllByRole('button', { name: /nova categoria/i })[0]);
    expect(screen.getByRole('heading', { name: 'Nova Categoria' })).toBeInTheDocument();
  });

  it('opens create modal from EmptyState button', () => {
    render(<CategoryList categories={[]} />);
    // EmptyState renders a second "Nova Categoria" button
    fireEvent.click(screen.getAllByRole('button', { name: /nova categoria/i })[1]);
    expect(screen.getByRole('heading', { name: 'Nova Categoria' })).toBeInTheDocument();
  });

  it('opens edit modal when pencil button is clicked', () => {
    render(<CategoryList categories={[category]} />);
    // buttons: [0]=Nova Categoria, [1]=pencil, [2]=trash
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]);
    expect(screen.getByRole('heading', { name: 'Editar Categoria' })).toBeInTheDocument();
  });

  it('opens delete confirmation modal when trash button is clicked', () => {
    render(<CategoryList categories={[category]} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[2]);
    expect(screen.getByRole('heading', { name: 'Confirmar exclusão' })).toBeInTheDocument();
  });

  it('closes delete modal when cancel is clicked', () => {
    render(<CategoryList categories={[category]} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[2]);
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(screen.queryByRole('heading', { name: 'Confirmar exclusão' })).not.toBeInTheDocument();
  });

  it('calls deleteCategory when confirm delete is clicked', async () => {
    const { deleteCategory } = jest.requireMock('@/server/actions/category');
    render(<CategoryList categories={[category]} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[2]); // open delete modal
    fireEvent.click(screen.getByText('Deletar'));
    await waitFor(() => expect(deleteCategory).toHaveBeenCalledWith('cat-1'));
  });
});
