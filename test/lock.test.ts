import { describe, expect, it } from 'vitest';
import { buildLock, computeDelta, serialiseLock } from '../src/lock.js';
import type { LockFile } from '../src/types.js';
import { makeHandbook, makeSpec } from './fixtures.js';

const previous: LockFile = {
  version: 1,
  generated: '2025-12-01T00:00:00.000Z',
  entries: [
    { spec_id: 'SPEC-A', title: 'A', content_hash: 'h-a', last_published: '2025-12-01T00:00:00.000Z', last_page: 5 },
    { spec_id: 'SPEC-B', title: 'B', content_hash: 'h-b-old', last_published: '2025-12-01T00:00:00.000Z', last_page: 9 },
    { spec_id: 'SPEC-GONE', title: 'Gone', content_hash: 'h-g', last_published: '2025-12-01T00:00:00.000Z', last_page: 20 },
  ],
};

const handbook = makeHandbook([
  makeSpec({ slug: 'a', id: 'SPEC-A', contentHash: 'h-a' }), // unchanged
  makeSpec({ slug: 'b', id: 'SPEC-B', contentHash: 'h-b-new' }), // changed
  makeSpec({ slug: 'c', id: 'SPEC-C', contentHash: 'h-c' }), // added
]);

describe('lock / delta detection', () => {
  it('computes added, changed, removed, unchanged sets', () => {
    const delta = computeDelta(handbook, previous);
    expect(delta.added).toEqual(['SPEC-C']);
    expect(delta.changed).toEqual(['SPEC-B']);
    expect(delta.removed).toEqual(['SPEC-GONE']);
    expect(delta.unchanged).toEqual(['SPEC-A']);
  });

  it('advances last_published only for changed/new specs and preserves pages', () => {
    const lock = buildLock(handbook, previous);
    const a = lock.entries.find((e) => e.spec_id === 'SPEC-A')!;
    const b = lock.entries.find((e) => e.spec_id === 'SPEC-B')!;
    const c = lock.entries.find((e) => e.spec_id === 'SPEC-C')!;
    expect(a.last_published).toBe('2025-12-01T00:00:00.000Z'); // preserved
    expect(a.last_page).toBe(5); // preserved
    expect(b.last_published).toBe(handbook.buildDate); // advanced
    expect(c.last_published).toBe(handbook.buildDate); // new
    expect(c.last_page).toBe(0);
    // Removed specs are dropped from the new lock.
    expect(lock.entries.find((e) => e.spec_id === 'SPEC-GONE')).toBeUndefined();
  });

  it('serialises deterministically with a trailing newline', () => {
    const s1 = serialiseLock(buildLock(handbook, previous));
    const s2 = serialiseLock(buildLock(handbook, previous));
    expect(s1).toBe(s2);
    expect(s1.endsWith('\n')).toBe(true);
  });
});
