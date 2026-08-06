import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';
import { scanSpecs } from '../src/scanner.js';
import type { HandbookConfig } from '../src/types.js';

let repoRoot: string;
let config: HandbookConfig;

beforeAll(() => {
  repoRoot = mkdtempSync(join(tmpdir(), 'handbook-scan-'));
  const specs = join(repoRoot, '.kiro', 'specs');

  // Spec 1: full spec with a diagram, no front matter -> derived id.
  const s1 = join(specs, 'statements');
  mkdirSync(s1, { recursive: true });
  writeFileSync(join(s1, 'requirements.md'), '# Statements\n\n### Requirement 1: Model\nbody\n\n### Requirement 2: Ownership\n');
  writeFileSync(join(s1, 'design.md'), '# Design\n\n## Overview\n');
  writeFileSync(join(s1, 'tasks.md'), '- [x] 1. Do it\n  - _Requirements: 1.1_\n- [ ] 2. Later\n');
  writeFileSync(join(s1, 'design-sketch.svg'), '<svg xmlns="http://www.w3.org/2000/svg"></svg>');

  // Spec 2: front matter overrides id + title.
  const s2 = join(specs, 'reserve-funds');
  mkdirSync(s2, { recursive: true });
  writeFileSync(
    join(s2, 'requirements.md'),
    '---\nspec_id: SPEC-RESERVE-001\ntitle: Reserve Funds\nversion: "1.0"\nstatus: draft\n---\n# RF\n\n### Requirement 1: Fund\n',
  );

  config = loadConfig({ repoRoot });
});

afterAll(() => {
  rmSync(repoRoot, { recursive: true, force: true });
});

describe('scanner (integration)', () => {
  it('discovers specs sorted by stable id', async () => {
    const specs = await scanSpecs(config);
    expect(specs.map((s) => s.id)).toEqual(['SPEC-RESERVE-001', 'SPEC-STATEMENTS']);
  });

  it('parses requirements, tasks and diagrams and honours front matter', async () => {
    const specs = await scanSpecs(config);
    const statements = specs.find((s) => s.id === 'SPEC-STATEMENTS')!;
    expect(statements.requirements).toHaveLength(2);
    expect(statements.tasks).toHaveLength(2);
    expect(statements.diagrams).toHaveLength(1);
    expect(statements.tasks[0].requirementNumbers).toEqual(['1.1']);

    const reserve = specs.find((s) => s.id === 'SPEC-RESERVE-001')!;
    expect(reserve.title).toBe('Reserve Funds');
    expect(reserve.version).toBe('1.0');
    expect(reserve.status).toBe('draft');
  });

  it('produces a stable content hash that changes only when content changes', async () => {
    const first = (await scanSpecs(config)).find((s) => s.id === 'SPEC-STATEMENTS')!.contentHash;
    const second = (await scanSpecs(config)).find((s) => s.id === 'SPEC-STATEMENTS')!.contentHash;
    expect(first).toBe(second);

    writeFileSync(join(repoRoot, '.kiro', 'specs', 'statements', 'design.md'), '# Design\n\nchanged\n');
    const third = (await scanSpecs(config)).find((s) => s.id === 'SPEC-STATEMENTS')!.contentHash;
    expect(third).not.toBe(first);
  });
});
