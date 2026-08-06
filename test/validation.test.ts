import { describe, expect, it } from 'vitest';
import { validateSpecs } from '../src/validation.js';
import { makeSpec } from './fixtures.js';

describe('validation', () => {
  it('flags duplicate spec ids as errors', () => {
    const a = makeSpec({ slug: 'a', id: 'SPEC-DUP' });
    const b = makeSpec({ slug: 'b', id: 'SPEC-DUP' });
    const report = validateSpecs([a, b]);
    expect(report.ok).toBe(false);
    expect(report.errorCount).toBe(1);
    expect(report.issues.some((i) => i.level === 'error' && /Duplicate/.test(i.message))).toBe(true);
  });

  it('warns about missing front matter and documents but stays ok', () => {
    const spec = makeSpec({
      slug: 'statements',
      documents: [
        { kind: 'requirements', absPath: '/r', relPath: 'r', content: '', frontMatter: {} },
      ],
      requirements: [],
    });
    const report = validateSpecs([spec]);
    expect(report.ok).toBe(true); // warnings only
    expect(report.warningCount).toBeGreaterThan(0);
    expect(report.issues.some((i) => /Missing design.md/.test(i.message))).toBe(true);
    expect(report.issues.some((i) => /No `spec_id`/.test(i.message))).toBe(true);
  });

  it('warns when a task references a non-existent requirement', () => {
    const spec = makeSpec({
      slug: 'x',
      documents: [
        { kind: 'requirements', absPath: '/r', relPath: 'r', content: '', frontMatter: { spec_id: 'SPEC-X', title: 't', version: 1, status: 'draft' } },
        { kind: 'design', absPath: '/d', relPath: 'd', content: '', frontMatter: {} },
        { kind: 'tasks', absPath: '/t', relPath: 't', content: '', frontMatter: {} },
      ],
      requirements: [{ id: 'SPEC-X:R1', specId: 'SPEC-X', number: 1, title: 'One' }],
      tasks: [{ id: 'SPEC-X:T1', specId: 'SPEC-X', number: '1', title: 'Do', done: true, requirementNumbers: ['9.1'] }],
    });
    const report = validateSpecs([spec]);
    expect(report.issues.some((i) => /Requirement 9 does not exist/.test(i.message))).toBe(true);
  });
});
