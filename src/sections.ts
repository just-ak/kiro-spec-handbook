import { existsSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { globby } from 'globby';
import { resolveFromRepo } from './config.js';
import { extractH1 } from './markdown.js';
import { parseFrontMatter } from './metadata.js';
import { anchors } from './references.js';
import { shiftHeadings } from './renderer.js';
import { cell, delimiter, landscapeCompact, portraitCompact } from './table.js';
import {
  countChars,
  countTokens,
  countWords,
  resolveProfiles,
  type TokenizerProfile,
} from './tokenizer.js';
import type { Handbook, HandbookConfig } from './types.js';

/** Turn a steering file name into a stable anchor slug. */
function steeringSlug(fileName: string): string {
  return `steering-${basename(fileName, '.md').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;
}

/**
 * Embed a steering document's content: front matter stripped, its own H1 used as
 * the subsection title, and remaining headings shifted to nest under Appendix A.
 */
function embedSteeringDoc(absPath: string, fileName: string): string {
  const { content } = parseFrontMatter(readFileSync(absPath, 'utf8'));
  const title = extractH1(content) ?? fileName;

  const lines = content.split(/\r?\n/);
  const h1Index = lines.findIndex((l) => /^#\s+/.test(l));
  if (h1Index !== -1) lines.splice(h1Index, 1);

  const body = shiftHeadings(lines.join('\n').trim(), 2);
  return [`### ${title} {#${steeringSlug(fileName)}}`, '', body, ''].join('\n');
}

/** Cover-adjacent "Document Information" section with build provenance. */
export function documentInfo(handbook: Handbook, config: HandbookConfig): string {
  const totalReqs = handbook.specs.reduce((n, s) => n + s.requirements.length, 0);
  const totalTasks = handbook.specs.reduce((n, s) => n + s.tasks.length, 0);
  const totalFigs = handbook.specs.reduce((n, s) => n + s.diagrams.length, 0);

  return [
    '# Document Information',
    '',
    '| Field | Value |',
    '| --- | --- |',
    `| Title | ${config.title} |`,
    `| Organisation | ${config.organisation || '—'} |`,
    `| Build date | ${handbook.buildDate} |`,
    `| Source revision | ${handbook.revision ?? 'working tree'} |`,
    `| Specifications | ${handbook.specs.length} |`,
    `| Requirements | ${totalReqs} |`,
    `| Tasks | ${totalTasks} |`,
    `| Diagrams | ${totalFigs} |`,
    `| Source of truth | \`${config.source.specs}\` |`,
    '',
    '> This handbook is generated automatically from the Kiro specifications. Do not edit it by hand — regenerate with `yarn handbook build`. The specs remain the single source of truth.',
    '',
  ].join('\n');
}

/** Architecture overview — links to the architecture spec and repo docs if present. */
export function architectureOverview(handbook: Handbook, config: HandbookConfig): string {
  const archSpec = handbook.specs.find((s) => s.slug === 'architecture');
  const lines = ['# Architecture Overview', ''];

  if (archSpec) {
    lines.push(
      `The platform architecture is specified in [\`${archSpec.id}\`](#${anchors.spec(archSpec.slug)}). Key views are reproduced in the Specifications section.`,
    );
  } else {
    lines.push('No dedicated `architecture` spec was found in the source tree.');
  }
  lines.push('');

  const docsPath = resolveFromRepo(config, 'docs/architecture');
  if (existsSync(docsPath)) {
    lines.push('Additional architecture documentation lives under `docs/architecture/`.');
    lines.push('');
  }

  // A compact map of specs by status to orient the reader.
  const byStatus = new Map<string, number>();
  for (const s of handbook.specs) byStatus.set(s.status, (byStatus.get(s.status) ?? 0) + 1);
  lines.push('| Status | Specs |', '| --- | ---: |');
  for (const [status, count] of [...byStatus.entries()].sort()) {
    lines.push(`| ${status} | ${count} |`);
  }
  lines.push('');
  return lines.join('\n');
}

/** Architecture Decisions — links to ADR specs (content is included in Specifications). */
export function architectureDecisions(handbook: Handbook): string {
  const adrSpecs = handbook.specs.filter(
    (s) => s.slug === 'adr' || s.slug.startsWith('adr-') || s.slug.includes('decision'),
  );
  const lines = ['# Architecture Decisions', ''];
  if (adrSpecs.length === 0) {
    lines.push('_No architecture decision records found in the source tree._', '');
    return lines.join('\n');
  }
  lines.push('Architecture decision records captured in the specs:', '');
  for (const s of adrSpecs) {
    lines.push(`- [${s.title} (\`${s.id}\`)](#${anchors.spec(s.slug)})`);
  }
  lines.push('');
  return lines.join('\n');
}

/**
 * Steering Documents — a top-level section (placed before the Specifications)
 * reproducing every steering document in full. These are project-wide rules and
 * guidance, not an appendix.
 */
export async function steeringSection(config: HandbookConfig): Promise<string> {
  const lines = ['# Steering Documents', ''];

  if (!config.source.steering) {
    lines.push('_No steering source configured._', '');
    return lines.join('\n');
  }

  const steeringDir = resolveFromRepo(config, config.source.steering);
  if (!existsSync(steeringDir)) {
    lines.push('_Steering directory not present._', '');
    return lines.join('\n');
  }

  const files = await globby('*.md', { cwd: steeringDir });
  files.sort();
  if (files.length === 0) {
    lines.push('_No steering documents found._', '');
    return lines.join('\n');
  }

  lines.push(
    `Project-wide rules and guidance from \`${config.source.steering}\`, reproduced in full.`,
    '',
  );
  for (const f of files) {
    lines.push(embedSteeringDoc(join(steeringDir, f), f));
  }
  lines.push('');
  return lines.join('\n');
}

/**
 * Appendices — consolidated reference-file listing plus any extra appendix
 * subsections (e.g. the tokenizer summary), appended in order after Appendix A.
 */
export function appendices(handbook: Handbook, extra: string[] = []): string {
  const lines = ['# Appendices', '', '## Appendix A — Reference Files', ''];
  const refs = handbook.specs.flatMap((s) => s.references);
  if (refs.length === 0) {
    lines.push('_No supplementary reference files found._');
  } else {
    lines.push('| Spec | Reference file |', '| --- | --- |');
    for (const r of refs) lines.push(`| ${r.specId} | \`${r.relPath}\` |`);
  }
  lines.push('');
  for (const section of extra) {
    if (section && section.trim()) {
      lines.push(section.trim(), '');
    }
  }
  return lines.join('\n');
}

interface TokenRow {
  /** First-column identifier (spec id or steering file name). */
  id: string;
  /** Optional second-column detail (spec title); omitted for steering. */
  title?: string;
  chars: number;
  words: number;
  tokens: number[];
}

const fmt = (n: number): string => n.toLocaleString('en-US');

/**
 * Render one token table (specs or steering) on a compact landscape page,
 * sorted largest-first by the primary model. Uses explicit column widths so the
 * long spec ids sit in their own column and never collide with the title or the
 * numeric columns.
 */
function tokenTable(
  heading: string,
  idLabel: string,
  rows: TokenRow[],
  profiles: TokenizerProfile[],
  emptyNote: string,
): string {
  if (rows.length === 0) {
    return [heading, '', emptyNote, ''].join('\n');
  }

  const showTitle = rows.some((r) => r.title && r.title.trim());

  // Surface bloat: largest first, by the primary (first) model's token count.
  const sorted = [...rows].sort((a, b) => (b.tokens[0] ?? 0) - (a.tokens[0] ?? 0));

  const header =
    `| ${idLabel} |` +
    (showTitle ? ' Title |' : '') +
    ' Chars | Words |' +
    profiles.map((p) => ` ${cell(p.label)} |`).join('');

  // Portrait keeps the running header/footer and reads better, but only fits a
  // handful of model columns. Fall back to landscape when there are many models.
  const portrait = profiles.length <= 3;

  const widthCols: Array<{ w: number; align?: 'l' | 'r' | 'c' }> = [
    { w: showTitle ? 34 : 26 },
  ];
  if (showTitle) widthCols.push({ w: 16 });
  widthCols.push({ w: 8, align: 'r' }, { w: 8, align: 'r' });
  for (const _ of profiles) widthCols.push({ w: 12, align: 'r' });

  const tableLines = [header, delimiter(widthCols)];

  const totals = { chars: 0, words: 0, tokens: profiles.map(() => 0) };
  for (const row of sorted) {
    const titleCell = showTitle ? ` ${cell(row.title ?? '')} |` : '';
    const numeric = row.tokens.map((t) => ` ${fmt(t)} |`).join('');
    tableLines.push(
      `| ${cell(row.id)} |${titleCell} ${fmt(row.chars)} | ${fmt(row.words)} |${numeric}`,
    );
    totals.chars += row.chars;
    totals.words += row.words;
    row.tokens.forEach((t, i) => (totals.tokens[i] += t));
  }

  const totalTitle = showTitle ? ' |' : '';
  const totalNumeric = totals.tokens.map((t) => ` **${fmt(t)}** |`).join('');
  tableLines.push(
    `| **Total** |${totalTitle} **${fmt(totals.chars)}** | **${fmt(totals.words)}** |${totalNumeric}`,
  );

  const wrap = portrait ? portraitCompact : landscapeCompact;
  return wrap(tableLines, heading).join('\n');
}

/**
 * Appendix B — Tokenizer Summary. Estimates token counts per spec and per
 * steering document across the configured models, so authors can spot bloat.
 * Returns '' when disabled in config.
 */
export async function tokenSummary(
  handbook: Handbook,
  config: HandbookConfig,
): Promise<string> {
  if (!config.tokenizer.enabled) return '';

  const profiles = resolveProfiles(config.tokenizer.models, config.tokenizer.chars_per_token);

  // Per-spec rows: all documents in a spec concatenated.
  const specRows: TokenRow[] = handbook.specs.map((s) => {
    const text = s.documents.map((d) => d.content).join('\n\n');
    return {
      id: s.id,
      title: s.title,
      chars: countChars(text),
      words: countWords(text),
      tokens: profiles.map((p) => countTokens(text, p)),
    };
  });

  // Per-steering-doc rows.
  const steeringRows: TokenRow[] = [];
  if (config.source.steering) {
    const steeringDir = resolveFromRepo(config, config.source.steering);
    if (existsSync(steeringDir)) {
      const files = (await globby('*.md', { cwd: steeringDir })).sort();
      for (const f of files) {
        const { content } = parseFrontMatter(readFileSync(join(steeringDir, f), 'utf8'));
        steeringRows.push({
          id: f,
          chars: countChars(content),
          words: countWords(content),
          tokens: profiles.map((p) => countTokens(content, p)),
        });
      }
    }
  }

  const ratios = profiles.map((p) => `${p.label} ≈ ${p.charsPerToken} chars/token`).join('; ');
  const lines = [
    '## Appendix B — Tokenizer Summary',
    '',
    'Estimated token counts for each specification and steering document, to help',
    'identify bloat. Counts are deterministic approximations based on characters',
    `per token (${ratios}). They are estimates, not exact tokenizer output.`,
    '',
  ];
  lines.push(
    tokenTable('### Specifications', 'Spec ID', specRows, profiles, '_No specifications found._'),
  );
  lines.push(
    tokenTable(
      '### Steering Documents',
      'Document',
      steeringRows,
      profiles,
      '_No steering documents found._',
    ),
  );
  return lines.join('\n');
}
