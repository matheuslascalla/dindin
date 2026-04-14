import { type ReactNode } from 'react';

interface ContentCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export function ContentCard({ title, children, className = '', action }: ContentCardProps) {
  return (
    <div className={`rounded-2xl bg-white p-6 shadow-card ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && <h2 className="text-base font-semibold text-slate-900">{title}</h2>}
          {action && <div className="ml-auto">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
