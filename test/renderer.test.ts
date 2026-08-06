import { describe, expect, it } from 'vitest';
import { assembleMarkdown, shiftHeadings, type HandbookParts } from '../src/renderer.js';
import { makeConfig, makeHandbook, makeSpec } from './fixtures.js';

const emptyParts: HandbookParts = {
  documentInfo: '# Document Information\n',
  revisionHistory: '# Revision History\n',
  architectureOverview: '# Architecture Overview\n',
  specIndex: '# Specification Index\n',
  requirementsIndex: '# Requirements Index\n',
  tasksIndex: '# Tasks Index\n',
  diagramIndex: '# Diagram Index\n',
  steering: '# Steering Documents\n',
  architectureDecisions: '# Architecture Decisions\n',
  traceability: '# Traceability Matrix\n',
  gitHistory: '# Git Change History\n',
  appendices: '# Appendices\n',
};

describe('renderer heading shifting', () => {
  it('shifts ATX headings and caps at level 6', () => {
    expect(shiftHeadings('# A\n## B', 2)).toBe('### A\n#### B');
    expect(shiftHeadings('###### Deep', 2)).toBe('###### Deep');
    expect(shiftHeadings('no heading', 2)).toBe('no heading');
  });
});

describe('assembleMarkdown', () => {
  const spec = makeSpec({
    slug: 'statements',
    documents: [
      { kind: 'requirements', absPath: '/r', relPath: 'r', content: '# Requirements Document\n\n### Requirement 1: Model\nbody', frontMatter: {} },
      { kind: 'design', absPath: '/d', relPath: 'd', content: '# Design\n\n## Overview', frontMatter: {} },
      { kind: 'tasks', absPath: '/t', relPath: 't', content: '# Plan\n\n- [x] 1. Do\n  - _Requirements: 1.1_', frontMatter: {} },
    ],
    requirements: [{ id: 'SPEC-STATEMENTS:R1', specId: 'SPEC-STATEMENTS', number: 1, title: 'Model' }],
  });

  it('assembles all sections in order with a metadata block and anchors', () => {
    const md = assembleMarkdown(makeHandbook([spec]), makeConfig(), emptyParts, new Map());
    expect(md.startsWith('---\ntitle:')).toBe(true);
    expect(md).toContain('# Specifications');
    expect(md).toContain('{#spec-statements}');
    expect(md).toContain('{#design-statements}');
    expect(md).toContain('{#tasks-statements}');
    // Requirement anchor injected then heading shifted (### -> #####).
    expect(md).toContain('##### Requirement 1: Model {#req-statements-1}');
    // Requirement ref in tasks linkified.
    expect(md).toContain('[1.1](#req-statements-1)');
    // Notes page emitted (notes_pages: true).
    expect(md).toContain('\\notespage');
    // Page breaks between top-level parts.
    expect(md).toContain('\\newpage');
  });

  it('omits indexes when disabled in config', () => {
    const config = makeConfig();
    config.indexes.requirements = false;
    const md = assembleMarkdown(makeHandbook([spec]), config, emptyParts, new Map());
    expect(md).not.toContain('# Requirements Index');
  });
});
