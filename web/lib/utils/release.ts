export const getReleasedTiers = (now: Date = new Date()) => {
  const launchDate = new Date('2026-02-01T00:00:00Z');
  const daysSinceLaunch = Math.floor((now.getTime() - launchDate.getTime()) / 86400000);

  if (daysSinceLaunch >= 21) return ['S', 'A', 'B', 'C'];
  if (daysSinceLaunch >= 14) return ['S', 'A', 'B'];
  if (daysSinceLaunch >= 7) return ['S', 'A'];
  return ['S'];
};
