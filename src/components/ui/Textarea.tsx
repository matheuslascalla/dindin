import * as LabelPrimitive from '@radix-ui/react-label';
import { type TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="space-y-1">
      {label && (
        <LabelPrimitive.Root className="block text-sm font-medium text-slate-600">
          {label}
        </LabelPrimitive.Root>
      )}
      <textarea
        ref={ref}
        className={cn(
          'w-full resize-none rounded-lg border bg-white px-3 py-2 text-sm text-slate-900',
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

Textarea.displayName = 'Textarea';
