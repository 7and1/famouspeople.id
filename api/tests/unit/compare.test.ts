import { describe, it, expect } from 'vitest';
import { buildComparison } from '../../src/services/compare.js';
import type { PersonProfile } from '../../src/services/identities.js';

const mockPeople: PersonProfile[] = [
  {
    fpid: 'FP-1',
    slug: 'alpha',
    full_name: 'Alpha',
    type: 'Person',
    net_worth: 100,
    height_cm: 180,
    birth_date: '1980-01-01',
    death_date: null,
    country: ['US'],
    mbti: null,
    zodiac: null,
    gender: null,
    occupation: [],
    image_url: null,
    wikipedia_url: null,
    social_links: {},
    bio_summary: null,
    age: 40,
  },
  {
    fpid: 'FP-2',
    slug: 'beta',
    full_name: 'Beta',
    type: 'Person',
    net_worth: 200,
    height_cm: 175,
    birth_date: '1970-01-01',
    death_date: null,
    country: ['US'],
    mbti: null,
    zodiac: null,
    gender: null,
    occupation: [],
    image_url: null,
    wikipedia_url: null,
    social_links: {},
    bio_summary: null,
    age: 50,
  },
  {
    fpid: 'FP-3',
    slug: 'gamma',
    full_name: 'Gamma',
    type: 'Person',
    net_worth: null,
    height_cm: 190,
    birth_date: '1990-01-01',
    death_date: null,
    country: ['UK'],
    mbti: null,
    zodiac: null,
    gender: null,
    occupation: [],
    image_url: null,
    wikipedia_url: null,
    social_links: {},
    bio_summary: null,
    age: 30,
  },
];

describe('buildComparison', () => {
  it('computes comparison summary', () => {
    const result = buildComparison(mockPeople);
    expect(result.comparison.richest).toBe('beta');
    expect(result.comparison.tallest).toBe('gamma');
    expect(result.comparison.oldest).toBe('beta');
    expect(result.comparison.net_worth_total).toBe(300);
  });

  it('includes original people in result', () => {
    const result = buildComparison(mockPeople);
    expect(result.people).toEqual(mockPeople);
  });

  it('calculates net_worth_total with nulls', () => {
    const result = buildComparison(mockPeople);
    expect(result.comparison.net_worth_total).toBe(300);
  });

  it('handles all null net_worth values', () => {
    const allNull: PersonProfile[] = [
      { ...mockPeople[0], net_worth: null },
      { ...mockPeople[2], net_worth: null },
    ];
    const result = buildComparison(allNull);
    expect(result.comparison.net_worth_total).toBe(0);
    expect(result.comparison.richest).toBeNull();
  });

  it('handles all null height_cm values', () => {
    const allNull: PersonProfile[] = [
      { ...mockPeople[0], height_cm: null },
      { ...mockPeople[2], height_cm: null },
    ];
    const result = buildComparison(allNull);
    expect(result.comparison.tallest).toBeNull();
  });

  it('handles all null age values', () => {
    const allNull: PersonProfile[] = [
      { ...mockPeople[0], age: null },
      { ...mockPeople[2], age: null },
    ];
    const result = buildComparison(allNull);
    expect(result.comparison.oldest).toBeNull();
  });

  it('handles empty array', () => {
    const result = buildComparison([]);
    expect(result.people).toEqual([]);
    expect(result.comparison.richest).toBeNull();
    expect(result.comparison.tallest).toBeNull();
    expect(result.comparison.oldest).toBeNull();
    expect(result.comparison.net_worth_total).toBe(0);
  });

  it('handles single person', () => {
    const result = buildComparison([mockPeople[0]]);
    expect(result.comparison.richest).toBe('alpha');
    expect(result.comparison.tallest).toBe('alpha');
    expect(result.comparison.oldest).toBe('alpha');
    expect(result.comparison.net_worth_total).toBe(100);
  });

  it('handles ties in net_worth (reduce returns second when equal)', () => {
    const tied: PersonProfile[] = [
      { ...mockPeople[0], net_worth: 100 },
      { ...mockPeople[2], net_worth: 100 },
    ];
    const result = buildComparison(tied);
    // The reduce compares a > b, when equal it returns b (second element)
    expect(result.comparison.richest).toBe('gamma');
  });

  it('handles ties in height (reduce returns second when equal)', () => {
    const tied: PersonProfile[] = [
      { ...mockPeople[0], height_cm: 180 },
      { ...mockPeople[2], height_cm: 180 },
    ];
    const result = buildComparison(tied);
    expect(result.comparison.tallest).toBe('gamma');
  });

  it('handles ties in age (reduce returns second when equal)', () => {
    const tied: PersonProfile[] = [
      { ...mockPeople[0], age: 40 },
      { ...mockPeople[2], age: 40 },
    ];
    const result = buildComparison(tied);
    expect(result.comparison.oldest).toBe('gamma');
  });

  it('returns null for richest when no one has net_worth', () => {
    const noWorth: PersonProfile[] = [
      { ...mockPeople[2], net_worth: null },
      { ...mockPeople[0], net_worth: null },
    ];
    const result = buildComparison(noWorth);
    expect(result.comparison.richest).toBeNull();
  });

  it('returns null for tallest when no one has height_cm', () => {
    const noHeight: PersonProfile[] = [
      { ...mockPeople[0], height_cm: null },
      { ...mockPeople[2], height_cm: null },
    ];
    const result = buildComparison(noHeight);
    expect(result.comparison.tallest).toBeNull();
  });

  it('returns null for oldest when no one has age', () => {
    const noAge: PersonProfile[] = [
      { ...mockPeople[0], age: null },
      { ...mockPeople[2], age: null },
    ];
    const result = buildComparison(noAge);
    expect(result.comparison.oldest).toBeNull();
  });

  it('handles zero net worth correctly', () => {
    const withZero: PersonProfile[] = [
      { ...mockPeople[0], net_worth: 0 },
      { ...mockPeople[2], net_worth: -50 },
    ];
    const result = buildComparison(withZero);
    expect(result.comparison.richest).toBe('alpha');
  });

  it('handles age of 0', () => {
    const withZeroAge: PersonProfile[] = [
      { ...mockPeople[0], age: 0 },
      { ...mockPeople[2], age: null },
    ];
    const result = buildComparison(withZeroAge);
    expect(result.comparison.oldest).toBe('alpha');
  });
});
