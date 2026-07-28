import { describe, expect, it } from 'vitest';

import { hashRefreshToken } from '../../src/lib/tokens.js';

describe('hashRefreshToken', () => {
  it('дає відомий SHA-256 hex', () => {
    expect(hashRefreshToken('prostir')).toBe(
      '8d1036f8f547c3183042b77ac0631e462ac2fd3888cd4658fbbb711ce57b213f',
    );
  });

  it('різні токени дають різні хеші', () => {
    expect(hashRefreshToken('prostir')).not.toBe(hashRefreshToken('prostir '));
  });

  it('повертає 64 hex-символи', () => {
    expect(hashRefreshToken('prostir')).toMatch(/^[0-9a-f]{64}$/);
  });
});
