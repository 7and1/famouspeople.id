import { FilterChip } from '../molecules';

interface FilterGroup {
  label: string;
  options: string[];
}

interface FilterBarProps {
  groups: FilterGroup[];
  active: Record<string, string | null>;
  onChange?: (group: string, value: string | null) => void;
  totalResults?: number;
}

export function FilterBar({ groups, active, onChange, totalResults }: FilterBarProps) {
  return (
    <div className="rounded-xl border border-surface-border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-text-primary">Filters</span>
        {typeof totalResults === 'number' && (
          <span className="text-xs text-text-muted">{totalResults} results</span>
        )}
      </div>
      <div className="mt-3 space-y-3">
        {groups.map((group) => (
          <div key={group.label} className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-text-muted">{group.label}</span>
            {group.options.map((option) => (
              <FilterChip
                key={option}
                label={option}
                active={active[group.label] === option}
                onClick={() => onChange?.(group.label, active[group.label] === option ? null : option)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
