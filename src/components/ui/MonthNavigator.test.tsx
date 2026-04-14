import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MonthNavigator } from './MonthNavigator';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));

// Mid-month UTC date avoids DST/timezone roll-over into adjacent months.
const PAST_MONTH = new Date('2020-06-15T12:00:00Z');
const CURRENT_MONTH = new Date(); // always the real current month

beforeEach(() => jest.clearAllMocks());

describe('MonthNavigator', () => {
  it('renders the month label for a past month', () => {
    render(<MonthNavigator currentMonth={PAST_MONTH} basePath="/gastos" />);
    expect(screen.getByText(/junho 2020/i)).toBeInTheDocument();
  });

  it('does NOT show the "Hoje" button when viewing the current month', () => {
    render(<MonthNavigator currentMonth={CURRENT_MONTH} basePath="/gastos" />);
    expect(screen.queryByText('Hoje')).not.toBeInTheDocument();
  });

  it('shows the "Hoje" button when viewing a past month', () => {
    render(<MonthNavigator currentMonth={PAST_MONTH} basePath="/gastos" />);
    expect(screen.getByText('Hoje')).toBeInTheDocument();
  });

  it('"Hoje" button navigates to basePath without query string', () => {
    render(<MonthNavigator currentMonth={PAST_MONTH} basePath="/gastos" />);
    fireEvent.click(screen.getByText('Hoje'));
    expect(mockPush).toHaveBeenCalledWith('/gastos');
  });

  it('prev button navigates to the previous month', () => {
    render(<MonthNavigator currentMonth={CURRENT_MONTH} basePath="/gastos" />);
    const [prevButton] = screen.getAllByRole('button');
    fireEvent.click(prevButton);
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('month='));
  });

  it('next button navigates to the next month', () => {
    render(<MonthNavigator currentMonth={CURRENT_MONTH} basePath="/gastos" />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[buttons.length - 1]);
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('month='));
  });
});
