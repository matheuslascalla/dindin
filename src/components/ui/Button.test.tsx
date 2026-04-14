import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Salvar</Button>);
    expect(screen.getByRole('button', { name: /salvar/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Clique</Button>);

    await userEvent.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const onClick = jest.fn();
    render(
      <Button disabled onClick={onClick}>
        Desabilitado
      </Button>
    );

    await userEvent.click(screen.getByRole('button'));

    expect(onClick).not.toHaveBeenCalled();
  });

  it('shows loading spinner and disables button when loading=true', () => {
    const onClick = jest.fn();
    render(
      <Button loading onClick={onClick}>
        Carregar
      </Button>
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    // Loader2 renders an SVG inside the button
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('does not show spinner when loading=false', () => {
    render(<Button>Normal</Button>);

    const button = screen.getByRole('button');
    expect(button.querySelector('svg')).not.toBeInTheDocument();
  });

  it('applies the danger variant class', () => {
    render(<Button variant="danger">Deletar</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-red-600');
  });

  it('applies the secondary variant class', () => {
    render(<Button variant="secondary">Cancelar</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-slate-600');
  });

  it('applies the sm size class', () => {
    render(<Button size="sm">Pequeno</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-xs');
  });

  it('forwards extra props (e.g. type=submit)', () => {
    render(<Button type="submit">Enviar</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });
});
