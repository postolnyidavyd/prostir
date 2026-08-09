import { describe, expect, it } from 'vitest';

import { hashToken } from '../../src/lib/tokens.js';

describe('hashRefreshToken', () => {
  it('дає відомий SHA-256 hex', () => {
    expect(hashToken('prostir')).toBe(
      '8d1036f8f547c3183042b77ac0631e462ac2fd3888cd4658fbbb711ce57b213f',
    );
  });

  it('різні токени дають різні хеші', () => {
    expect(hashToken('prostir')).not.toBe(hashToken('prostir '));
  });

  it('повертає 64 hex-символи', () => {
    expect(hashToken('prostir')).toMatch(/^[0-9a-f]{64}$/);
  });
});
