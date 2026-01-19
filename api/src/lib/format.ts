export const calculateAge = (birthDate: string | null, deathDate?: string | null): number | null => {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  const endDate = deathDate ? new Date(deathDate) : new Date();
  if (Number.isNaN(endDate.getTime())) return null;
  let age = endDate.getFullYear() - birth.getFullYear();
  const m = endDate.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && endDate.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
};

export const formatCurrencyShort = (value: number | null): string | null => {
  if (value === null || value === undefined) return null;
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(1)}T`;
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value}`;
};
