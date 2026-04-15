'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface PersonOption {
  name: string;
  image?: string | null;
}

interface PersonToggleProps {
  persons: PersonOption[];
  value: string | null | undefined;
  onChange: (name: string | null) => void;
  label?: string;
}

export function PersonToggle({ persons, value, onChange, label }: PersonToggleProps) {
  if (persons.length === 0) return null;

  return (
    <div className="space-y-2">
      {label && <span className="block text-sm font-medium text-slate-600">{label}</span>}

      <div className="grid grid-cols-4 gap-2">
        {persons.map((person) => {
          const isSelected = value === person.name;
          const initial = person.name.charAt(0).toUpperCase();

          return (
            <button
              key={person.name}
              type="button"
              title={person.name}
              onClick={() => onChange(isSelected ? null : person.name)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg px-2 py-2.5 transition-colors',
                isSelected
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
              )}
            >
              {person.image ? (
                <Image
                  src={person.image}
                  alt={person.name}
                  width={32}
                  height={32}
                  className={cn(
                    'h-8 w-8 rounded-full object-cover ring-2 ring-offset-1',
                    isSelected ? 'ring-white' : 'ring-transparent'
                  )}
                />
              ) : (
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
                    isSelected ? 'bg-teal-500 text-white' : 'bg-slate-300 text-slate-600'
                  )}
                >
                  {initial}
                </div>
              )}
              <span className="w-full truncate text-center text-xs">{person.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
