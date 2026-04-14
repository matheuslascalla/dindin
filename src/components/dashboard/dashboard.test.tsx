import { render, screen } from '@testing-library/react';
import { SummaryCards } from './SummaryCards';
import { CategoryAlerts } from './CategoryAlerts';
import { TopExpensesList } from './TopExpensesList';
import { PersonBreakdownCard } from './PersonBreakdownCard';
import { CardSummaryCard } from './CardSummaryCard';
import { CategoryDonutChart } from './CategoryDonutChart';
import { MonthlyBarChart } from './MonthlyBarChart';

// Recharts uses browser SVG layout APIs unavailable in jsdom
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: () => null,
  Bar: () => null,
  Cell: () => null,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
}));

// ─── SummaryCards ────────────────────────────────────────────────────────────

const baseSummary = {
  monthlyIncome: 5000,
  eventualIncome: 0,
  weeklyIncome: 0,
  totalExpenses: 3000,
  balance: 2000,
  biggestExpense: { name: 'Aluguel', value: 1500 },
};

describe('SummaryCards', () => {
  it('renders all four metric cards', () => {
    render(<SummaryCards summary={baseSummary} />);
    expect(screen.getByText('Renda Mensal')).toBeInTheDocument();
    expect(screen.getByText('Total de Gastos')).toBeInTheDocument();
    expect(screen.getByText('Saldo do Mês')).toBeInTheDocument();
    expect(screen.getByText('Maior Gasto')).toBeInTheDocument();
  });

  it('shows eventual income subtext when eventualIncome > 0', () => {
    render(<SummaryCards summary={{ ...baseSummary, eventualIncome: 200 }} />);
    expect(screen.getByText(/eventual/i)).toBeInTheDocument();
  });

  it('shows "Sem gastos" when biggestExpense is null', () => {
    render(<SummaryCards summary={{ ...baseSummary, biggestExpense: null }} />);
    expect(screen.getByText('Sem gastos')).toBeInTheDocument();
  });

  it('shows positive balance text', () => {
    render(<SummaryCards summary={{ ...baseSummary, balance: 500 }} />);
    expect(screen.getByText('Você está no positivo')).toBeInTheDocument();
  });

  it('shows negative balance text', () => {
    render(<SummaryCards summary={{ ...baseSummary, balance: -100 }} />);
    expect(screen.getByText('Gastos acima da renda')).toBeInTheDocument();
  });
});

// ─── CategoryAlerts ──────────────────────────────────────────────────────────

const baseAlert = {
  id: 'cat-1',
  name: 'Alimentação',
  color: '#FF0000',
  limitPercent: 20,
  currentPercent: 25,
  status: 'danger' as const,
};

describe('CategoryAlerts', () => {
  it('shows "Tudo sob controle" when alerts list is empty', () => {
    render(<CategoryAlerts alerts={[]} />);
    expect(screen.getByText('Tudo sob controle')).toBeInTheDocument();
  });

  it('renders a danger alert', () => {
    render(<CategoryAlerts alerts={[baseAlert]} />);
    expect(screen.getByText('Alimentação')).toBeInTheDocument();
    expect(screen.getByText(/ultrapassado/i)).toBeInTheDocument();
  });

  it('renders a warning alert', () => {
    render(<CategoryAlerts alerts={[{ ...baseAlert, status: 'warning' as const }]} />);
    expect(screen.getByText(/próximo do limite/i)).toBeInTheDocument();
  });

  it('shows alert count in the title', () => {
    render(<CategoryAlerts alerts={[baseAlert, { ...baseAlert, id: 'cat-2', name: 'Saúde' }]} />);
    expect(screen.getByText(/alertas \(2\)/i)).toBeInTheDocument();
  });
});

// ─── TopExpensesList ─────────────────────────────────────────────────────────

const baseExpense = {
  name: 'Mercado',
  value: 500,
  categoryName: 'Alimentação',
  categoryColor: '#6B7280',
  source: 'expense' as const,
};

describe('TopExpensesList', () => {
  it('shows empty state when no expenses', () => {
    render(<TopExpensesList expenses={[]} />);
    expect(screen.getByText('Sem gastos neste mês')).toBeInTheDocument();
  });

  it('renders expense items', () => {
    render(<TopExpensesList expenses={[baseExpense]} />);
    expect(screen.getByText('Mercado')).toBeInTheDocument();
  });

  it('shows card name for card expenses', () => {
    render(<TopExpensesList expenses={[{ ...baseExpense, source: 'card', cardName: 'Nubank' }]} />);
    expect(screen.getByText('Nubank')).toBeInTheDocument();
  });

  it('shows person when present', () => {
    render(<TopExpensesList expenses={[{ ...baseExpense, person: 'Maria' }]} />);
    expect(screen.getByText('Maria')).toBeInTheDocument();
  });
});

// ─── PersonBreakdownCard ─────────────────────────────────────────────────────

describe('PersonBreakdownCard', () => {
  it('shows empty state when data is empty', () => {
    render(<PersonBreakdownCard data={[]} total={0} />);
    expect(screen.getByText(/nenhum gasto com pessoa/i)).toBeInTheDocument();
  });

  it('renders person names', () => {
    render(<PersonBreakdownCard data={[{ person: 'João', totalValue: 1000 }]} total={2000} />);
    expect(screen.getByText('João')).toBeInTheDocument();
  });

  it('calculates percentage correctly', () => {
    render(<PersonBreakdownCard data={[{ person: 'Maria', totalValue: 1000 }]} total={2000} />);
    expect(screen.getByText('50.0%')).toBeInTheDocument();
  });

  it('shows 0% when total is zero', () => {
    render(<PersonBreakdownCard data={[{ person: 'Alguém', totalValue: 0 }]} total={0} />);
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });
});

// ─── CardSummaryCard ─────────────────────────────────────────────────────────

describe('CardSummaryCard', () => {
  it('shows empty state when no cards', () => {
    render(<CardSummaryCard data={[]} />);
    expect(screen.getByText('Nenhum cartão cadastrado')).toBeInTheDocument();
  });

  it('renders card names and expense counts', () => {
    render(
      <CardSummaryCard
        data={[{ cardId: 'c1', cardName: 'Nubank', totalValue: 500, expenseCount: 3 }]}
      />
    );
    expect(screen.getByText('Nubank')).toBeInTheDocument();
    expect(screen.getByText('3 lançamento(s)')).toBeInTheDocument();
  });
});

// ─── CategoryDonutChart ──────────────────────────────────────────────────────

const categoryData = [
  {
    id: 'cat-1',
    name: 'Alimentação',
    color: '#6B7280',
    limitPercent: 20,
    totalValue: 500,
    percentOfIncome: 10,
    status: 'ok' as const,
  },
];

describe('CategoryDonutChart', () => {
  it('renders category list', () => {
    render(<CategoryDonutChart data={categoryData} />);
    expect(screen.getByText('Alimentação')).toBeInTheDocument();
  });

  it('shows empty state when no data has values', () => {
    render(<CategoryDonutChart data={[{ ...categoryData[0], totalValue: 0 }]} />);
    expect(screen.getByText('Sem gastos neste mês')).toBeInTheDocument();
  });
});

// ─── MonthlyBarChart ─────────────────────────────────────────────────────────

describe('MonthlyBarChart', () => {
  it('renders legend labels', () => {
    render(<MonthlyBarChart data={[{ month: 'mar', income: 5000, expenses: 3000 }]} />);
    expect(screen.getByText('Renda')).toBeInTheDocument();
    expect(screen.getByText('Gastos')).toBeInTheDocument();
  });

  it('renders with empty data', () => {
    render(<MonthlyBarChart data={[]} />);
    expect(screen.getByText('Renda')).toBeInTheDocument();
  });
});
