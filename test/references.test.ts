import { describe, expect, it } from 'vitest';
import {
  buildReferenceIndex,
  injectRequirementAnchors,
  linkifyRequirementRefs,
  linkifySpecPaths,
} from '../src/references.js';
import type { Spec } from '../src/types.js';

function fakeSpec(slug: string): Spec {
  return {
    id: `SPEC-${slug.toUpperCase()}`,
    slug,
    title: slug,
    version: '1',
    status: 'draft',
    dir: `/x/${slug}`,
    documents: [],
    requirements: [],
    tasks: [],
    diagrams: [],
    references: [],
    contentHash: 'h',
  };
}

describe('cross references', () => {
  it('injects deterministic anchors on requirement headings', () => {
    const out = injectRequirementAnchors('### Requirement 3: Ownership', 'statements');
    expect(out).toBe('### Requirement 3: Ownership {#req-statements-3}');
  });

  it('linkifies requirement reference lines to the right anchors', () => {
    const out = linkifyRequirementRefs('_Requirements: 3.1, 4.2_', 'statements');
    expect(out).toContain('[3.1](#req-statements-3)');
    expect(out).toContain('[4.2](#req-statements-4)');
  });

  it('linkifies known .kiro/specs paths and leaves unknown slugs alone', () => {
    const index = buildReferenceIndex([fakeSpec('statements')]);
    const known = linkifySpecPaths('see .kiro/specs/statements/design.md', index);
    expect(known).toContain('](#design-statements)');
    const unknown = linkifySpecPaths('see .kiro/specs/nope/design.md', index);
    expect(unknown).toBe('see .kiro/specs/nope/design.md');
  });
});
