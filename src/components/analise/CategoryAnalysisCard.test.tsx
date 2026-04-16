import { render, screen } from '@testing-library/react';
import { CategoryAnalysisCard } from './CategoryAnalysisCard';
import type { CategoryDetailBreakdown } from '@/server/actions/dashboard';

const base: CategoryDetailBreakdown = {
  id: 'cat-1',
  name: 'Alimentação',
  color: '#14B8A6',
  icon: 'utensils',
  limitPercent: 20,
  totalValue: 500,
  percentOfIncome: 15,
  percentOfLimit: 75,
  status: 'ok',
  subcategories: [],
  directValue: 500,
};

describe('CategoryAnalysisCard', () => {
  it('renders category name and limit percent', () => {
    render(<CategoryAnalysisCard category={base} />);

    expect(screen.getByText('Alimentação')).toBeInTheDocument();
    expect(screen.getByText('Limite: 20.0%')).toBeInTheDocument();
  });

  it('renders formatted total value and percent of income', () => {
    render(<CategoryAnalysisCard category={base} />);

    expect(screen.getByText('15.0% da renda')).toBeInTheDocument();
  });

  it('shows "Nenhum gasto neste mês." when totalValue is 0', () => {
    render(<CategoryAnalysisCard category={{ ...base, totalValue: 0, directValue: 0 }} />);

    expect(screen.getByText('Nenhum gasto neste mês.')).toBeInTheDocument();
  });

  it('shows "Sem sub-categoria" row when there is directValue but no subcategories', () => {
    render(<CategoryAnalysisCard category={{ ...base, subcategories: [], directValue: 500 }} />);

    expect(screen.getByText('Sem sub-categoria')).toBeInTheDocument();
  });

  it('renders subcategory rows when subcategories exist', () => {
    const category: CategoryDetailBreakdown = {
      ...base,
      directValue: 0,
      subcategories: [
        { id: 'sub-1', name: 'Delivery', totalValue: 300, percentOfCategory: 60 },
        { id: 'sub-2', name: 'Mercado', totalValue: 200, percentOfCategory: 40 },
      ],
    };

    render(<CategoryAnalysisCard category={category} />);

    expect(screen.getByText('Delivery')).toBeInTheDocument();
    expect(screen.getByText('Mercado')).toBeInTheDocument();
  });

  it('applies warning color class when status is warning', () => {
    const { container } = render(
      <CategoryAnalysisCard category={{ ...base, status: 'warning' }} />
    );

    expect(container.querySelector('.text-amber-500')).toBeInTheDocument();
  });

  it('applies danger color class when status is danger', () => {
    const { container } = render(<CategoryAnalysisCard category={{ ...base, status: 'danger' }} />);

    expect(container.querySelector('.text-red-500')).toBeInTheDocument();
  });

  it('shows zero percent of limit when limitPercent is 0', () => {
    render(<CategoryAnalysisCard category={{ ...base, limitPercent: 0, percentOfLimit: 0 }} />);

    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
