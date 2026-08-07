import type { Handbook, HandbookConfig, Spec } from '../src/types.js';

export function makeSpec(partial: Partial<Spec> & { slug: string }): Spec {
  const slug = partial.slug;
  const id = partial.id ?? `SPEC-${slug.toUpperCase()}`;
  return {
    id,
    slug,
    title: partial.title ?? slug,
    version: partial.version ?? '1.0',
    status: partial.status ?? 'draft',
    dir: partial.dir ?? `/repo/.kiro/specs/${slug}`,
    documents: partial.documents ?? [],
    requirements: partial.requirements ?? [],
    tasks: partial.tasks ?? [],
    diagrams: partial.diagrams ?? [],
    references: partial.references ?? [],
    contentHash: partial.contentHash ?? 'hash-' + slug,
  };
}

export function makeHandbook(specs: Spec[]): Handbook {
  return { specs, buildDate: '2026-01-01T00:00:00.000Z', revision: 'abc1234' };
}

export function makeConfig(): HandbookConfig {
  return {
    title: 'Test Handbook',
    subtitle: 'Sub',
    organisation: 'Org',
    source: { specs: '.kiro/specs', steering: '.kiro/steering' },
    output: { directory: 'docs/handbook', filename: 'handbook' },
    pdf: {
      paper: 'A4',
      notes_pages: true,
      template: 'templates/handbook.latex',
      toc_depth: 3,
      header_shows_spec_id: true,
    },
    indexes: { specs: true, requirements: true, tasks: true, diagrams: true, changes: true },
    traceability: { enabled: true },
    tokenizer: { enabled: true, models: ['opus-4.8', 'haiku', 'gpt-4o'] },
    git: { history_limit: 200, release_tag_glob: 'v*' },
    build_date: undefined,
    repoRoot: '/repo',
    toolRoot: '/repo/tools/handbook',
  };
}
