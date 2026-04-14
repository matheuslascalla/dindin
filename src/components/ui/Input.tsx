import * as LabelPrimitive from '@radix-ui/react-label';
import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="space-y-1">
      {label && (
        <LabelPrimitive.Root className="block text-sm font-medium text-slate-600">
          {label}
        </LabelPrimitive.Root>
      )}
      <input
        ref={ref}
        className={cn(
          'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900',
          'transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2',
          error
            ? 'border-red-400 focus:border-destructive focus:ring-destructive/20'
            : 'border-input focus:border-ring focus:ring-ring/20',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
);

Input.displayName = 'Input';
