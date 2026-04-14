import { render, screen } from '@testing-library/react';
import { Sidebar } from './Sidebar';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));
jest.mock('@/server/actions/auth', () => ({
  signOutAction: jest.fn(),
}));

import { usePathname } from 'next/navigation';

const mockUsePathname = usePathname as jest.Mock;

const defaultProps = {
  user: { name: 'João Silva', email: 'joao@example.com', image: null },
  contextLabel: 'Pessoal',
  houseId: null,
};

describe('Sidebar', () => {
  it('renders all 5 navigation items', () => {
    mockUsePathname.mockReturnValue('/dashboard');

    render(<Sidebar {...defaultProps} />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Rendas')).toBeInTheDocument();
    expect(screen.getByText('Gastos')).toBeInTheDocument();
    expect(screen.getByText('Cartões')).toBeInTheDocument();
    expect(screen.getByText('Categorias')).toBeInTheDocument();
  });

  it('applies active styles to the current route', () => {
    mockUsePathname.mockReturnValue('/rendas');

    render(<Sidebar {...defaultProps} />);

    const activeLink = screen.getByText('Rendas').closest('a');
    expect(activeLink).toHaveClass('text-teal-700');
  });

  it('does not apply active styles to non-current routes', () => {
    mockUsePathname.mockReturnValue('/rendas');

    render(<Sidebar {...defaultProps} />);

    const inactiveLink = screen.getByText('Gastos').closest('a');
    expect(inactiveLink).toHaveClass('text-slate-500');
    expect(inactiveLink).not.toHaveClass('text-teal-700');
  });

  it('matches sub-routes (pathname starts with href)', () => {
    mockUsePathname.mockReturnValue('/cartoes/detalhe');

    render(<Sidebar {...defaultProps} />);

    const activeLink = screen.getByText('Cartões').closest('a');
    expect(activeLink).toHaveClass('text-teal-700');
  });

  it('renders user name and context label', () => {
    mockUsePathname.mockReturnValue('/dashboard');

    render(<Sidebar {...defaultProps} />);

    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('Pessoal')).toBeInTheDocument();
  });
});
