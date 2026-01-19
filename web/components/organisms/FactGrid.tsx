import { FactItem } from '../molecules';

interface Fact {
  label: string;
  value?: string | number | null;
}

export function FactGrid({ facts, columns = 3 }: { facts: Fact[]; columns?: number }) {
  const columnClass = columns === 2 ? 'md:grid-cols-2' : columns === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3';
  return (
    <div className={`grid gap-3 ${columnClass}`}>
      {facts.map((fact) => (
        <FactItem key={fact.label} label={fact.label} value={fact.value} />
      ))}
    </div>
  );
}
