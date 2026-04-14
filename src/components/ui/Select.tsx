'use client';

import * as SelectPrimitive from '@radix-ui/react-select';
import * as LabelPrimitive from '@radix-ui/react-label';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  value?: string;
  /** Aceita tanto onValueChange(string) quanto onChange({ target: { value } }) */
  onChange?: (e: { target: { value: string } }) => void;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  className?: string;
}

export function Select({
  label,
  error,
  options,
  placeholder,
  value,
  onChange,
  onValueChange,
  disabled,
  className,
}: SelectProps) {
  const handleValueChange = (val: string) => {
    onValueChange?.(val);
    onChange?.({ target: { value: val } });
  };

  return (
    <div className="space-y-1">
      {label && (
        <LabelPrimitive.Root className="block text-sm font-medium text-slate-600">
          {label}
        </LabelPrimitive.Root>
      )}
      <SelectPrimitive.Root value={value} onValueChange={handleValueChange} disabled={disabled}>
        <SelectPrimitive.Trigger
          className={cn(
            'flex w-full items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm text-slate-900',
            'cursor-pointer transition-colors focus:outline-none focus:ring-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            '[&>span]:line-clamp-1',
            error
              ? 'border-red-400 focus:border-destructive focus:ring-destructive/20'
              : 'border-input focus:border-ring focus:ring-ring/20',
            className
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder ?? 'Selecionar...'} />
          <SelectPrimitive.Icon>
            <ChevronDown size={14} className="shrink-0 text-slate-400" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={4}
            className={cn(
              'relative z-50 w-[var(--radix-select-trigger-width)] min-w-[8rem] overflow-hidden',
              'rounded-xl border border-slate-200 bg-white shadow-card',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
              'data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1'
            )}
          >
            <SelectPrimitive.Viewport className="p-1">
              {options.map((opt) => (
                <SelectPrimitive.Item
                  key={opt.value}
                  value={opt.value}
                  className={cn(
                    'relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-3 pr-8 text-sm text-slate-900',
                    'outline-none focus:bg-accent focus:text-accent-foreground',
                    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
                  )}
                >
                  <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="absolute right-2 flex items-center">
                    <Check size={14} className="text-primary" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
