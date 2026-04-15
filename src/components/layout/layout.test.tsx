// AppShell is an async server component — call it as a function, then render the result.
jest.mock('@/server/actions/auth', () => ({
  signOutAction: jest.fn(),
}));
jest.mock('@/auth', () => ({
  auth: jest.fn().mockResolvedValue({
    user: { name: 'Test User', email: 'test@test.com', image: null },
  }),
}));
jest.mock('@/lib/context', () => ({
  getActiveContext: jest.fn().mockResolvedValue({ type: 'personal' }),
  getContextFilter: jest.fn().mockResolvedValue({ userId: 'user-test', houseId: null }),
}));
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/dashboard'),
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import { AppShell } from './AppShell';

describe('AppShell', () => {
  it('renders children inside the layout', async () => {
    const jsx = await AppShell({ children: <p>Page content</p> });
    render(jsx);
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it('renders the sidebar navigation', async () => {
    const jsx = await AppShell({ children: <p>Content</p> });
    render(jsx);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
