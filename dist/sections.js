import { existsSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { globby } from 'globby';
import { resolveFromRepo } from './config.js';
import { extractH1 } from './markdown.js';
import { parseFrontMatter } from './metadata.js';
import { anchors } from './references.js';
import { shiftHeadings } from './renderer.js';
/** Turn a steering file name into a stable anchor slug. */
function steeringSlug(fileName) {
    return `steering-${basename(fileName, '.md').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;
}
/**
 * Embed a steering document's content: front matter stripped, its own H1 used as
 * the subsection title, and remaining headings shifted to nest under Appendix A.
 */
function embedSteeringDoc(absPath, fileName) {
    const { content } = parseFrontMatter(readFileSync(absPath, 'utf8'));
    const title = extractH1(content) ?? fileName;
    const lines = content.split(/\r?\n/);
    const h1Index = lines.findIndex((l) => /^#\s+/.test(l));
    if (h1Index !== -1)
        lines.splice(h1Index, 1);
    const body = shiftHeadings(lines.join('\n').trim(), 2);
    return [`### ${title} {#${steeringSlug(fileName)}}`, '', body, ''].join('\n');
}
/** Cover-adjacent "Document Information" section with build provenance. */
export function documentInfo(handbook, config) {
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
export function architectureOverview(handbook, config) {
    const archSpec = handbook.specs.find((s) => s.slug === 'architecture');
    const lines = ['# Architecture Overview', ''];
    if (archSpec) {
        lines.push(`The platform architecture is specified in [\`${archSpec.id}\`](#${anchors.spec(archSpec.slug)}). Key views are reproduced in the Specifications section.`);
    }
    else {
        lines.push('No dedicated `architecture` spec was found in the source tree.');
    }
    lines.push('');
    const docsPath = resolveFromRepo(config, 'docs/architecture');
    if (existsSync(docsPath)) {
        lines.push('Additional architecture documentation lives under `docs/architecture/`.');
        lines.push('');
    }
    // A compact map of specs by status to orient the reader.
    const byStatus = new Map();
    for (const s of handbook.specs)
        byStatus.set(s.status, (byStatus.get(s.status) ?? 0) + 1);
    lines.push('| Status | Specs |', '| --- | ---: |');
    for (const [status, count] of [...byStatus.entries()].sort()) {
        lines.push(`| ${status} | ${count} |`);
    }
    lines.push('');
    return lines.join('\n');
}
/** Architecture Decisions — links to ADR specs (content is included in Specifications). */
export function architectureDecisions(handbook) {
    const adrSpecs = handbook.specs.filter((s) => s.slug === 'adr' || s.slug.startsWith('adr-') || s.slug.includes('decision'));
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
export async function steeringSection(config) {
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
    lines.push(`Project-wide rules and guidance from \`${config.source.steering}\`, reproduced in full.`, '');
    for (const f of files) {
        lines.push(embedSteeringDoc(join(steeringDir, f), f));
    }
    lines.push('');
    return lines.join('\n');
}
/** Appendices — consolidated reference-file listing. */
export function appendices(handbook) {
    const lines = ['# Appendices', '', '## Appendix A — Reference Files', ''];
    const refs = handbook.specs.flatMap((s) => s.references);
    if (refs.length === 0) {
        lines.push('_No supplementary reference files found._');
    }
    else {
        lines.push('| Spec | Reference file |', '| --- | --- |');
        for (const r of refs)
            lines.push(`| ${r.specId} | \`${r.relPath}\` |`);
    }
    lines.push('');
    return lines.join('\n');
}
//# sourceMappingURL=sections.js.map