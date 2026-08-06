import { describe, expect, it } from 'vitest';
import {
  deriveSpecId,
  diagramId,
  requirementId,
  resolveStatus,
  resolveTitle,
  resolveVersion,
  slugToToken,
  taskId,
} from '../src/metadata.js';

describe('metadata / stable ids', () => {
  it('tokenises slugs deterministically', () => {
    expect(slugToToken('service-charge-reconciliation')).toBe('SERVICE-CHARGE-RECONCILIATION');
    expect(slugToToken('  weird__slug!! ')).toBe('WEIRD-SLUG');
  });

  it('prefers front matter spec_id over the derived id', () => {
    expect(deriveSpecId('statements', { spec_id: 'SPEC-RESERVE-001' })).toBe('SPEC-RESERVE-001');
  });

  it('derives a stable id from the slug when no front matter is present', () => {
    expect(deriveSpecId('statements', {})).toBe('SPEC-STATEMENTS');
    // Stability: the id must not depend on file names or headings, only the slug.
    expect(deriveSpecId('statements', {})).toBe(deriveSpecId('statements', {}));
  });

  it('builds stable requirement/task/diagram ids', () => {
    expect(requirementId('SPEC-STATEMENTS', 3)).toBe('SPEC-STATEMENTS:R3');
    expect(taskId('SPEC-STATEMENTS', '4.1')).toBe('SPEC-STATEMENTS:T4.1');
    expect(diagramId('SPEC-STATEMENTS', 2)).toBe('FIG-STATEMENTS-2');
  });

  it('resolves title/version/status with sensible fallbacks', () => {
    expect(resolveTitle('reserve-funds', {})).toBe('Reserve Funds');
    expect(resolveTitle('x', { title: 'Custom' })).toBe('Custom');
    expect(resolveVersion({})).toBe('—');
    expect(resolveVersion({ version: 1.2 })).toBe('1.2');
    expect(resolveStatus({})).toBe('unspecified');
    expect(resolveStatus({ status: 'Draft' })).toBe('draft');
  });
});
