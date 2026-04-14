import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';

describe('Modal', () => {
  it('renders nothing visible when isOpen=false', () => {
    render(
      <Modal isOpen={false} onClose={jest.fn()} title="Título">
        <p>Conteúdo</p>
      </Modal>
    );

    expect(screen.queryByText('Título')).not.toBeInTheDocument();
    expect(screen.queryByText('Conteúdo')).not.toBeInTheDocument();
  });

  it('renders title and children when isOpen=true', () => {
    render(
      <Modal isOpen onClose={jest.fn()} title="Editar Gasto">
        <p>Form content</p>
      </Modal>
    );

    expect(screen.getByText('Editar Gasto')).toBeInTheDocument();
    expect(screen.getByText('Form content')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', async () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen onClose={onClose} title="Modal">
        <p>Conteúdo</p>
      </Modal>
    );

    await userEvent.click(screen.getByRole('button', { name: /fechar/i }));

    expect(onClose).toHaveBeenCalled();
  });
});
