import type { SupabaseClient } from '@supabase/supabase-js';
import { getPeopleBySlugs, type PersonProfile } from './identities.js';

const pickRichest = (people: PersonProfile[]) => {
  const withWorth = people.filter((p) => typeof p.net_worth === 'number');
  if (!withWorth.length) return null;
  return withWorth.reduce((a, b) => (a.net_worth! > b.net_worth! ? a : b)).slug;
};

const pickTallest = (people: PersonProfile[]) => {
  const withHeight = people.filter((p) => typeof p.height_cm === 'number');
  if (!withHeight.length) return null;
  return withHeight.reduce((a, b) => (a.height_cm! > b.height_cm! ? a : b)).slug;
};

const pickOldest = (people: PersonProfile[]) => {
  const withAge = people.filter((p) => typeof p.age === 'number');
  if (!withAge.length) return null;
  return withAge.reduce((a, b) => (a.age! > b.age! ? a : b)).slug;
};

export const buildComparison = (people: PersonProfile[]) => {
  const netWorthTotal = people.reduce((sum, p) => sum + (p.net_worth || 0), 0);
  return {
    people,
    comparison: {
      richest: pickRichest(people),
      tallest: pickTallest(people),
      oldest: pickOldest(people),
      net_worth_total: netWorthTotal,
    },
  };
};

export const comparePeople = async (supabase: SupabaseClient, slugs: string[]) => {
  const people = await getPeopleBySlugs(supabase, slugs);
  return buildComparison(people);
};
