import { describe, expect, it } from 'vitest';

import { formatDisplayName } from '../../src/lib/names.js';

describe('formatDisplayName', () => {
  it('прізвище та ініціал імені', () => {
    expect(formatDisplayName('Давид', 'Постольний')).toBe('Постольний Д.');
  });

  it('ім’я з малої літери піднімається', () => {
    expect(formatDisplayName('давид', 'Постольний')).toBe('Постольний Д.');
  });

});
