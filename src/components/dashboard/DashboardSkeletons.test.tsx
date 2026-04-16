import { render } from '@testing-library/react';
import {
  SummaryCardsSkeleton,
  CategorySectionSkeleton,
  HistorySectionSkeleton,
  BottomSectionSkeleton,
} from './DashboardSkeletons';

describe('DashboardSkeletons', () => {
  it('renders SummaryCardsSkeleton without errors', () => {
    const { container } = render(<SummaryCardsSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders CategorySectionSkeleton without errors', () => {
    const { container } = render(<CategorySectionSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders HistorySectionSkeleton without errors', () => {
    const { container } = render(<HistorySectionSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders BottomSectionSkeleton with default 3 columns', () => {
    const { container } = render(<BottomSectionSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders BottomSectionSkeleton with 2 columns', () => {
    const { container } = render(<BottomSectionSkeleton cols={2} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
