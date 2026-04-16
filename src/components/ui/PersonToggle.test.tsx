import { render, screen, fireEvent } from '@testing-library/react';
import { PersonToggle } from './PersonToggle';

const persons = [
  { name: 'Alice', image: null },
  { name: 'Bob', image: null },
];

describe('PersonToggle', () => {
  it('renders nothing when persons list is empty', () => {
    const { container } = render(<PersonToggle persons={[]} value={null} onChange={jest.fn()} />);

    expect(container.firstChild).toBeNull();
  });

  it('renders a button for each person', () => {
    render(<PersonToggle persons={persons} value={null} onChange={jest.fn()} />);

    expect(screen.getByTitle('Alice')).toBeInTheDocument();
    expect(screen.getByTitle('Bob')).toBeInTheDocument();
  });

  it('renders optional label when provided', () => {
    render(<PersonToggle persons={persons} value={null} onChange={jest.fn()} label="Pessoa" />);

    expect(screen.getByText('Pessoa')).toBeInTheDocument();
  });

  it('calls onChange with person name when unselected button is clicked', () => {
    const onChange = jest.fn();
    render(<PersonToggle persons={persons} value={null} onChange={onChange} />);

    fireEvent.click(screen.getByTitle('Alice'));

    expect(onChange).toHaveBeenCalledWith('Alice');
  });

  it('calls onChange with null when selected button is clicked (deselect)', () => {
    const onChange = jest.fn();
    render(<PersonToggle persons={persons} value="Alice" onChange={onChange} />);

    fireEvent.click(screen.getByTitle('Alice'));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('shows initials when person has no image', () => {
    render(
      <PersonToggle persons={[{ name: 'Carlos', image: null }]} value={null} onChange={jest.fn()} />
    );

    expect(screen.getByText('C')).toBeInTheDocument();
  });
});
