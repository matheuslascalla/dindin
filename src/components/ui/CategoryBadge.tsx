interface CategoryBadgeProps {
  color: string;
  name: string;
}

export function CategoryBadge({ color, name }: CategoryBadgeProps) {
  return (
    <span className="inline-flex max-w-[160px] items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span className="truncate">{name}</span>
    </span>
  );
}
