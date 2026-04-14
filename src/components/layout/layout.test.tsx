import { render, screen } from '@testing-library/react';
import { AppShell } from './AppShell';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/dashboard'),
}));

describe('AppShell', () => {
  it('renders children inside the layout', () => {
    render(
      <AppShell>
        <p>Page content</p>
      </AppShell>
    );
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it('renders the sidebar', () => {
    render(
      <AppShell>
        <p>Content</p>
      </AppShell>
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
