import { getCategoryIcon } from '@/lib/utils';

interface CategoryBadgeProps {
  color: string;
  name: string;
  icon?: string;
}

export function CategoryBadge({ color, name, icon }: CategoryBadgeProps) {
  const IconComponent = icon ? getCategoryIcon(icon) : null;

  return (
    <span className="inline-flex max-w-[160px] items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
      {IconComponent ? (
        <IconComponent className="h-3 w-3 shrink-0" style={{ color }} />
      ) : (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      )}
      <span className="truncate">{name}</span>
    </span>
  );
}
