import { render, screen, fireEvent } from '@testing-library/react';
import { ExpensePagination } from './ExpensePagination';

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: pushMock })),
  usePathname: jest.fn(() => '/gastos'),
  useSearchParams: jest.fn(() => ({ toString: () => 'month=2024-03-01' })),
}));

beforeEach(() => pushMock.mockClear());

describe('ExpensePagination', () => {
  it('renders nothing when pageCount is 1', () => {
    const { container } = render(<ExpensePagination currentPage={1} pageCount={1} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when pageCount is 0', () => {
    const { container } = render(<ExpensePagination currentPage={1} pageCount={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders prev and next buttons when pageCount > 1', () => {
    render(<ExpensePagination currentPage={2} pageCount={5} />);
    expect(screen.getByRole('button', { name: /anterior/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /próxima/i })).toBeInTheDocument();
  });

  it('shows current page and total pages', () => {
    render(<ExpensePagination currentPage={2} pageCount={5} />);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('disables prev button on first page', () => {
    render(<ExpensePagination currentPage={1} pageCount={3} />);
    expect(screen.getByRole('button', { name: /anterior/i })).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(<ExpensePagination currentPage={3} pageCount={3} />);
    expect(screen.getByRole('button', { name: /próxima/i })).toBeDisabled();
  });

  it('calls router.push with page-1 when prev is clicked', () => {
    render(<ExpensePagination currentPage={3} pageCount={5} />);
    fireEvent.click(screen.getByRole('button', { name: /anterior/i }));
    expect(pushMock).toHaveBeenCalledWith(expect.stringContaining('page=2'));
  });

  it('calls router.push with page+1 when next is clicked', () => {
    render(<ExpensePagination currentPage={2} pageCount={5} />);
    fireEvent.click(screen.getByRole('button', { name: /próxima/i }));
    expect(pushMock).toHaveBeenCalledWith(expect.stringContaining('page=3'));
  });

  it('preserves existing search params when navigating', () => {
    render(<ExpensePagination currentPage={1} pageCount={3} />);
    fireEvent.click(screen.getByRole('button', { name: /próxima/i }));
    expect(pushMock).toHaveBeenCalledWith(expect.stringContaining('month=2024-03-01'));
  });
});
