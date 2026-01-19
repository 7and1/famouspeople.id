interface DateDisplayProps {
  date?: string | null;
}

export function DateDisplay({ date }: DateDisplayProps) {
  if (!date) return <span>—</span>;
  const formatted = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return <span>{formatted}</span>;
}
