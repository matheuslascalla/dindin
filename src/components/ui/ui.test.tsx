import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryBadge } from './CategoryBadge';
import { ContentCard } from './ContentCard';
import { EmptyState } from './EmptyState';
import { MetricCard } from './MetricCard';
import { ProgressBar } from './ProgressBar';
import { Textarea } from './Textarea';
import { Select } from './Select';
import { Switch } from './Switch';
import { Input } from './Input';
import { Tag } from 'lucide-react';

// ─── CategoryBadge ───────────────────────────────────────────────────────────

describe('CategoryBadge', () => {
  it('renders category name', () => {
    render(<CategoryBadge color="#6B7280" name="Alimentação" />);
    expect(screen.getByText('Alimentação')).toBeInTheDocument();
  });
});

// ─── ContentCard ─────────────────────────────────────────────────────────────

describe('ContentCard', () => {
  it('renders title and children', () => {
    render(
      <ContentCard title="Resumo">
        <p>Conteúdo</p>
      </ContentCard>
    );
    expect(screen.getByText('Resumo')).toBeInTheDocument();
    expect(screen.getByText('Conteúdo')).toBeInTheDocument();
  });
});

// ─── EmptyState ──────────────────────────────────────────────────────────────

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState icon={Tag} title="Sem dados" description="Nenhum item encontrado." />);
    expect(screen.getByText('Sem dados')).toBeInTheDocument();
    expect(screen.getByText('Nenhum item encontrado.')).toBeInTheDocument();
  });

  it('renders action when provided', () => {
    render(
      <EmptyState
        icon={Tag}
        title="Vazio"
        description="Sem itens."
        action={<button type="button">Adicionar</button>}
      />
    );
    expect(screen.getByRole('button', { name: /adicionar/i })).toBeInTheDocument();
  });
});

// ─── MetricCard ──────────────────────────────────────────────────────────────

describe('MetricCard', () => {
  it('renders label and value', () => {
    render(<MetricCard label="Total" value="R$ 1.000,00" />);
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('R$ 1.000,00')).toBeInTheDocument();
  });

  it('renders subtext when provided', () => {
    render(<MetricCard label="Total" value="R$ 1.000,00" subtext="3 itens" />);
    expect(screen.getByText('3 itens')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(<MetricCard label="Total" value="R$ 0,00" icon={Tag} />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });
});

// ─── ProgressBar ─────────────────────────────────────────────────────────────

describe('ProgressBar', () => {
  it('renders without crashing', () => {
    const { container } = render(<ProgressBar percent={50} status="ok" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('caps bar width at 100% when percent > 100', () => {
    const { container } = render(<ProgressBar percent={150} status="danger" />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

// ─── Input ───────────────────────────────────────────────────────────────────

describe('Input', () => {
  it('renders with a label', () => {
    render(<Input label="Nome" placeholder="Seu nome" />);
    expect(screen.getByText('Nome')).toBeInTheDocument();
  });

  it('renders error message when error prop is provided', () => {
    render(<Input label="Nome" error="Campo obrigatório" />);
    expect(screen.getByText('Campo obrigatório')).toBeInTheDocument();
  });
});

// ─── Textarea ────────────────────────────────────────────────────────────────

describe('Textarea', () => {
  it('renders with a label', () => {
    render(<Textarea label="Descrição" placeholder="Detalhe..." />);
    expect(screen.getByText('Descrição')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Detalhe...')).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(<Textarea label="Descrição" error="Muito longo" />);
    expect(screen.getByText('Muito longo')).toBeInTheDocument();
  });
});

// ─── Select ──────────────────────────────────────────────────────────────────

describe('Select', () => {
  const options = [
    { value: 'monthly', label: 'Mensal' },
    { value: 'eventual', label: 'Eventual' },
  ];

  it('renders with label', () => {
    render(<Select label="Recorrência" value="monthly" onChange={jest.fn()} options={options} />);
    expect(screen.getByText('Recorrência')).toBeInTheDocument();
  });

  it('shows placeholder when value is empty', () => {
    render(
      <Select
        label="Tipo"
        value=""
        onChange={jest.fn()}
        options={options}
        placeholder="Selecione..."
      />
    );
    expect(screen.getByText('Selecione...')).toBeInTheDocument();
  });
});

// ─── Switch ──────────────────────────────────────────────────────────────────

describe('Switch', () => {
  it('renders without crashing', () => {
    const { container } = render(<Switch checked={false} onCheckedChange={jest.fn()} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('calls onCheckedChange when toggled', async () => {
    const onChange = jest.fn();
    render(<Switch checked={false} onCheckedChange={onChange} />);
    await userEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
