import { describe, expect, it } from 'vitest';
import {
  diagramIndex,
  requirementsIndex,
  specIndex,
  tasksIndex,
  traceabilityMatrix,
} from '../src/indexer.js';
import { makeHandbook, makeSpec } from './fixtures.js';

const spec = makeSpec({
  slug: 'statements',
  requirements: [
    { id: 'SPEC-STATEMENTS:R1', specId: 'SPEC-STATEMENTS', number: 1, title: 'Model' },
    { id: 'SPEC-STATEMENTS:R2', specId: 'SPEC-STATEMENTS', number: 2, title: 'Ownership' },
  ],
  tasks: [
    { id: 'SPEC-STATEMENTS:T1', specId: 'SPEC-STATEMENTS', number: '1', title: 'Do it', done: true, requirementNumbers: ['1'] },
    { id: 'SPEC-STATEMENTS:T2.1', specId: 'SPEC-STATEMENTS', number: '2.1', title: 'Sub', done: false, requirementNumbers: ['2.3'] },
  ],
  diagrams: [
    { id: 'FIG-STATEMENTS-1', specId: 'SPEC-STATEMENTS', caption: 'Design Sketch', absPath: '/a.svg', relPath: '.kiro/specs/statements/a.svg' },
  ],
  documents: [{ kind: 'design', absPath: '/d', relPath: 'd', content: '# Design', frontMatter: {} }],
});

describe('indexer', () => {
  it('renders a specification index with counts', () => {
    const md = specIndex(makeHandbook([spec]));
    expect(md).toContain('# Specification Index');
    expect(md).toContain('SPEC-STATEMENTS');
    expect(md).toContain('| 2 | 2 | 1 |'); // reqs, tasks, figs
  });

  it('renders requirements and tasks indexes with links', () => {
    const reqs = requirementsIndex(makeHandbook([spec]));
    expect(reqs).toContain('#req-statements-1');
    const tasks = tasksIndex(makeHandbook([spec]));
    expect(tasks).toContain('☑');
    expect(tasks).toContain('☐');
  });

  it('assigns figure numbers in the diagram index', () => {
    const hb = makeHandbook([spec]);
    const md = diagramIndex(hb);
    expect(md).toContain('Figure 1');
    expect(hb.specs[0].diagrams[0].figureNumber).toBe(1);
  });

  it('builds a traceability matrix linking reqs to tasks', () => {
    const md = traceabilityMatrix(makeHandbook([spec]));
    expect(md).toContain('# Traceability Matrix');
    // Requirement 1 is referenced by task 1.
    expect(md).toMatch(/SPEC-STATEMENTS:R1.*\[1\]\(#tasks-statements\)/);
    // Requirement 2 has no task referencing head "2" (only "2.3" -> head 2 actually).
  });
});
