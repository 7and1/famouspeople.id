import { describe, it, expect } from 'vitest';
import { calculateAge, formatCurrencyShort } from '../../src/lib/format.js';

describe('formatCurrencyShort', () => {
  it('formats trillions', () => {
    expect(formatCurrencyShort(2500000000000)).toBe('$2.5T');
    expect(formatCurrencyShort(1500000000000)).toBe('$1.5T');
  });

  it('formats billions', () => {
    expect(formatCurrencyShort(250000000000)).toBe('$250.0B');
    expect(formatCurrencyShort(1000000000)).toBe('$1.0B');
  });

  it('formats millions', () => {
    expect(formatCurrencyShort(1500000)).toBe('$1.5M');
    expect(formatCurrencyShort(1000000)).toBe('$1.0M');
  });

  it('formats thousands', () => {
    expect(formatCurrencyShort(15000)).toBe('$15.0K');
    expect(formatCurrencyShort(1000)).toBe('$1.0K');
  });

  it('formats small amounts', () => {
    expect(formatCurrencyShort(500)).toBe('$500');
    expect(formatCurrencyShort(0)).toBe('$0');
    expect(formatCurrencyShort(1)).toBe('$1');
  });

  it('handles negative values', () => {
    expect(formatCurrencyShort(-1500000)).toBe('$-1.5M');
    expect(formatCurrencyShort(-500)).toBe('$-500');
  });

  it('returns null for null input', () => {
    expect(formatCurrencyShort(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(formatCurrencyShort(undefined)).toBeNull();
  });
});

describe('calculateAge', () => {
  it('calculates age for living person', () => {
    const age = calculateAge('2000-01-01', '2020-01-01');
    expect(age).toBe(20);
  });

  it('calculates age for deceased person', () => {
    const age = calculateAge('1950-06-15', '2020-03-10');
    expect(age).toBe(69);
  });

  it('calculates age with death_date provided', () => {
    const age = calculateAge('1990-05-20', '2010-05-19');
    expect(age).toBe(19);
  });

  it('calculates age on birthday', () => {
    const age = calculateAge('2000-01-01', '2020-01-01');
    expect(age).toBe(20);
  });

  it('calculates age day before birthday', () => {
    const age = calculateAge('2000-01-01', '2019-12-31');
    expect(age).toBe(19);
  });

  it('returns null for null birth_date', () => {
    expect(calculateAge(null)).toBeNull();
  });

  it('returns null for undefined birth_date', () => {
    expect(calculateAge(undefined as any)).toBeNull();
  });

  it('handles null death_date as current date (living)', () => {
    const birthDate = '1990-01-01';
    const age = calculateAge(birthDate, null);
    expect(age).toBeGreaterThan(30);
    expect(age).toBeLessThan(100);
  });

  it('handles invalid date strings', () => {
    expect(calculateAge('invalid-date')).toBeNull();
    expect(calculateAge('not-a-date', '2020-01-01')).toBeNull();
  });

  it('handles invalid death date', () => {
    const age = calculateAge('2000-01-01', 'invalid-date');
    expect(age).toBeNull();
  });

  it('calculates age correctly for leap year birth', () => {
    const age = calculateAge('2000-02-29', '2020-02-28');
    expect(age).toBe(19);
  });

  it('calculates age for very old person', () => {
    const age = calculateAge('1920-01-01', '2020-01-01');
    expect(age).toBe(100);
  });

  it('handles month edge cases', () => {
    // Same year, earlier month (birth in June, date in Jan)
    expect(calculateAge('2000-06-01', '2000-01-01')).toBe(-1);
    // Same year, later month
    expect(calculateAge('2000-01-01', '2000-06-01')).toBe(0);
  });

  it('handles day edge cases', () => {
    // Same year/month, earlier day
    expect(calculateAge('2000-01-15', '2000-01-01')).toBe(-1);
    // Same year/month, later day
    expect(calculateAge('2000-01-01', '2000-01-15')).toBe(0);
  });
});
