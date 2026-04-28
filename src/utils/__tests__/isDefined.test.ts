import { describe, it, expect } from 'vitest';

function isDefined<T>(val: T | undefined | null): val is T {
  return val !== undefined && val !== null;
}

describe('isDefined', () => {
  it('returns true for numbers', () => {
    expect(isDefined(1)).toBe(true);
  });

  it('returns false for undefined', () => {
    expect(isDefined(undefined)).toBe(false);
  });
});
