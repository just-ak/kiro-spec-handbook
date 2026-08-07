import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { execa } from 'execa';
import { resolveFromRepo, resolveFromTool } from './config.js';
import { logger } from './logger.js';
import {
  anchors,
  buildReferenceIndex,
  injectRequirementAnchors,
  linkifyRequirementRefs,
  linkifySpecPaths,
  type ReferenceIndex,
} from './references.js';
import { captionFromFileName } from './markdown.js';
import {
  extractMermaidBlocks,
  findMmdc,
  renderMermaidToSvg,
  replaceMermaidBlocks,
} from './mermaid.js';
import type { Handbook, HandbookConfig, Spec, SpecDocument } from './types.js';

type SvgConverter = 'rsvg-convert' | 'inkscape' | 'cairosvg' | null;

/** Markdown fragments produced by the indexer/changelog, injected in order. */
export interface HandbookParts {
  documentInfo: string;
  revisionHistory: string;
  architectureOverview: string;
  specIndex: string;
  requirementsIndex: string;
  tasksIndex: string;
  diagramIndex: string;
  steering: string;
  architectureDecisions: string;
  traceability: string;
  gitHistory: string;
  appendices: string;
}

export interface RenderResult {
  markdownPath: string;
  pdfPath: string | null;
  pandocAvailable: boolean;
}

import { homedir } from 'node:os';
import { globbySync } from 'globby';

const MAX_HEADING_LEVEL = 6;

/**
 * Build an environment for child processes with common Pandoc/TeX/SVG-tool
 * locations prepended to PATH. TinyTeX in particular installs to the user's
 * home and often cannot symlink onto the system PATH without sudo, so we locate
 * it directly and the tool works without any shell configuration.
 */
function toolEnv(): NodeJS.ProcessEnv {
  const home = homedir();
  const candidates = [
    ...globbySync([`${home}/Library/TinyTeX/bin/*`, `${home}/.TinyTeX/bin/*`], {
      onlyDirectories: true,
    }),
    '/Library/TeX/texbin', // MacTeX
    '/usr/local/texlive/bin', // TeX Live (may need arch subdir)
    ...globbySync('/usr/local/texlive/*/bin/*', { onlyDirectories: true }),
    '/opt/homebrew/bin',
    '/usr/local/bin',
  ];
  const existing = process.env.PATH ?? '';
  const extra = candidates.filter((p) => existsSync(p));
  return { ...process.env, PATH: [...extra, existing].filter(Boolean).join(':') };
}

const CHILD_ENV = toolEnv();

/** Shift every ATX heading in `content` down by `by` levels (capped at h6). */
export function shiftHeadings(content: string, by: number): string {
  if (by <= 0) return content;
  return content.replace(/^(#{1,6})(\s+)/gm, (_m, hashes: string, space: string) => {
    const level = Math.min(hashes.length + by, MAX_HEADING_LEVEL);
    return '#'.repeat(level) + space;
  });
}

/** Remove the first level-1 heading (the embedded doc's own title). */
function stripFirstH1(content: string): string {
  const lines = content.split(/\r?\n/);
  const idx = lines.findIndex((l) => /^#\s+/.test(l));
  if (idx === -1) return content;
  lines.splice(idx, 1);
  return lines.join('\n');
}

interface DiagramImage {
  markdownPath: string; // path relative to the output directory
  converted: boolean;
}

/** Wrap block content on its own landscape page (command wrappers, template-defined). */
function landscape(inner: string): string {
  return `\n\\blandscape\n\n${inner}\n\n\\elandscape\n`;
}

const FILE_INCLUDE = /#\[\[file:([^\]]+)\]\]/g;

/**
 * Resolve Kiro `#[[file:PATH]]` includes inside the steering section.
 *
 * Paths are resolved relative to the steering directory. A standalone SVG include
 * (the only content on its line) is rendered to PDF and embedded as a landscape
 * figure; inline includes (e.g. inside backticks) are replaced with the plain
 * path so they read as references without breaking the surrounding text.
 */
async function resolveSteeringIncludes(
  steeringMarkdown: string,
  config: HandbookConfig,
  outputDir: string,
  converter: SvgConverter,
): Promise<string> {
  if (!steeringMarkdown.includes('#[[file:')) return steeringMarkdown;

  const steeringDir = resolveFromRepo(config, config.source.steering ?? '.kiro/steering');
  const assetsDir = join(outputDir, 'assets', 'steering');
  mkdirSync(assetsDir, { recursive: true });

  const lines = steeringMarkdown.split('\n');
  const out: string[] = [];

  for (const line of lines) {
    const standalone = /^\s*#\[\[file:([^\]]+)\]\]\s*$/.exec(line);
    if (standalone) {
      const rel = standalone[1].trim();
      const abs = join(steeringDir, rel);
      const caption = captionFromFileName(basename(rel));
      if (/\.svg$/i.test(rel) && existsSync(abs) && converter) {
        const safe = rel.replace(/[^a-zA-Z0-9]+/g, '_');
        const svgCopy = join(assetsDir, `${safe}.svg`);
        copyFileSync(abs, svgCopy);
        const pdfDest = join(assetsDir, `${safe}.pdf`);
        const ok = await convertSvg(converter, svgCopy, pdfDest);
        out.push(
          ok
            ? landscape(`![${caption}](assets/steering/${safe}.pdf)`)
            : `_Diagram source: \`${rel}\`_`,
        );
      } else {
        out.push(`_Referenced file: \`${rel}\`_`);
      }
      continue;
    }
    // Inline include(s): drop the wrapper, keep the path as a readable reference.
    out.push(line.replace(FILE_INCLUDE, (_m, p: string) => `\`${p.trim()}\``));
  }

  return out.join('\n');
}

/** Replace mermaid fenced blocks with rendered figure images (or keep as code). */
function embedMermaid(
  content: string,
  spec: Spec,
  docKind: SpecDocument['kind'],
  mermaidImages: Map<string, DiagramImage | null>,
): string {
  return replaceMermaidBlocks(content, (block) => {
    const img = mermaidImages.get(`${spec.slug}:${docKind}:${block.index}`);
    const caption = `${spec.title} — diagram ${block.index + 1}`;
    if (img && img.converted) {
      // Diagrams go on their own landscape page for legibility.
      return landscape(`![${caption}](${img.markdownPath})`);
    }
    // No rendered image: keep the mermaid source as a fenced code block so it
    // is still visible/searchable rather than silently dropped.
    return `\n\`\`\`\n${block.code}\n\`\`\`\n`;
  });
}

/** Prepare a single embedded document: mermaid, linkify, anchor, strip title, shift. */
function embedDocument(
  doc: SpecDocument,
  spec: Spec,
  refIndex: ReferenceIndex,
  mermaidImages: Map<string, DiagramImage | null>,
): string {
  let content = doc.content;
  content = embedMermaid(content, spec, doc.kind, mermaidImages);
  content = linkifySpecPaths(content, refIndex);
  if (doc.kind === 'requirements') content = injectRequirementAnchors(content, spec.slug);
  if (doc.kind === 'tasks') content = linkifyRequirementRefs(content, spec.slug);
  content = stripFirstH1(content);
  return shiftHeadings(content, 2);
}

/** Detect an available SVG→PDF converter for LaTeX embedding. */
async function detectSvgConverter(): Promise<SvgConverter> {
  for (const tool of ['rsvg-convert', 'inkscape', 'cairosvg'] as const) {
    try {
      await execa(tool, ['--version'], { env: CHILD_ENV });
      return tool;
    } catch {
      /* try next */
    }
  }
  return null;
}

async function convertSvg(
  tool: 'rsvg-convert' | 'inkscape' | 'cairosvg',
  src: string,
  dest: string,
): Promise<boolean> {
  try {
    if (tool === 'rsvg-convert') {
      await execa('rsvg-convert', ['-f', 'pdf', '-o', dest, src], { env: CHILD_ENV });
    } else if (tool === 'inkscape') {
      await execa('inkscape', [src, '--export-type=pdf', `--export-filename=${dest}`], {
        env: CHILD_ENV,
      });
    } else {
      await execa('cairosvg', [src, '-o', dest], { env: CHILD_ENV });
    }
    return existsSync(dest);
  } catch {
    return false;
  }
}

/**
 * Copy diagram sources into `<output>/assets` and convert SVG→PDF when a
 * converter is available (required for LaTeX/PDF embedding). Returns a map from
 * diagram id to the image path (relative to the output dir) or null when the
 * diagram can only be referenced, not embedded.
 */
async function prepareDiagrams(
  handbook: Handbook,
  outputDir: string,
  converter: SvgConverter,
): Promise<Map<string, DiagramImage | null>> {
  const assetsDir = join(outputDir, 'assets');
  mkdirSync(assetsDir, { recursive: true });

  const map = new Map<string, DiagramImage | null>();

  for (const spec of handbook.specs) {
    for (const d of spec.diagrams) {
      const svgName = basename(d.absPath);
      // Namespace by spec slug to avoid collisions (many specs share file names).
      const safeSvg = `${spec.slug}__${svgName}`;
      const svgDest = join(assetsDir, safeSvg);
      copyFileSync(d.absPath, svgDest);

      if (converter) {
        const pdfName = safeSvg.replace(/\.svg$/i, '.pdf');
        const ok = await convertSvg(converter, svgDest, join(assetsDir, pdfName));
        map.set(d.id, ok ? { markdownPath: `assets/${pdfName}`, converted: true } : null);
      } else {
        // Keep the SVG reference for HTML/markdown consumers; LaTeX will skip it.
        map.set(d.id, { markdownPath: `assets/${safeSvg}`, converted: false });
      }
    }
  }

  return map;
}

/**
 * Render every ```mermaid``` block in the requirements/design/tasks documents to
 * an SVG (via mermaid-cli) and then to PDF (for LaTeX embedding). Returns a map
 * keyed `${slug}:${kind}:${index}` → image, or null where rendering failed.
 */
async function prepareMermaid(
  handbook: Handbook,
  config: HandbookConfig,
  outputDir: string,
  converter: SvgConverter,
): Promise<Map<string, DiagramImage | null>> {
  const map = new Map<string, DiagramImage | null>();

  const EMBEDDED_KINDS: ReadonlyArray<SpecDocument['kind']> = ['requirements', 'design', 'tasks'];
  const total = handbook.specs.reduce(
    (n, s) =>
      n +
      s.documents.reduce(
        (m, d) => m + (EMBEDDED_KINDS.includes(d.kind) ? extractMermaidBlocks(d.content).length : 0),
        0,
      ),
    0,
  );
  if (total === 0) return map;

  const mmdc = findMmdc(config.repoRoot);
  if (!mmdc) {
    logger.warn(
      'mermaid-cli (mmdc) not found. Install it with `npm i -D -w @ledgiventa/handbook @mermaid-js/mermaid-cli`. Mermaid blocks will render as code.',
    );
    return map;
  }

  const assetsDir = join(outputDir, 'assets', 'mermaid');
  mkdirSync(assetsDir, { recursive: true });
  logger.step(`Rendering ${total} mermaid diagram(s) with mmdc…`);

  // Only the requirements/design/tasks documents are embedded in the handbook,
  // so only their mermaid blocks are worth rendering.
  let rendered = 0;
  for (const spec of handbook.specs) {
    for (const doc of spec.documents) {
      if (!EMBEDDED_KINDS.includes(doc.kind)) continue;
      const blocks = extractMermaidBlocks(doc.content);
      for (const block of blocks) {
        const key = `${spec.slug}:${doc.kind}:${block.index}`;
        const base = `${spec.slug}-${doc.kind}-${block.index}`;
        const svgDest = join(assetsDir, `${base}.svg`);
        const ok = await renderMermaidToSvg(mmdc, block.code, assetsDir, svgDest, CHILD_ENV);
        if (!ok) {
          map.set(key, null);
          continue;
        }
        if (converter) {
          const pdfDest = join(assetsDir, `${base}.pdf`);
          const cok = await convertSvg(converter, svgDest, pdfDest);
          map.set(
            key,
            cok
              ? { markdownPath: `assets/mermaid/${base}.pdf`, converted: true }
              : { markdownPath: `assets/mermaid/${base}.svg`, converted: false },
          );
        } else {
          map.set(key, { markdownPath: `assets/mermaid/${base}.svg`, converted: false });
        }
        rendered++;
      }
    }
  }
  logger.success(`Rendered ${rendered}/${total} mermaid diagram(s).`);
  return map;
}

function diagramsSection(spec: Spec, images: Map<string, DiagramImage | null>): string {
  if (spec.diagrams.length === 0) return '';
  const parts: string[] = [];
  // Emit the "### Diagrams" heading only once, and — for embedded figures — place
  // it INSIDE the first landscape block so it stays on the same landscape page as
  // the figure. Emitting it before \blandscape would strand it on the preceding
  // portrait page, because entering landscape starts a new page.
  const heading = '### Diagrams';
  let headingEmitted = false;

  for (const d of spec.diagrams) {
    const img = images.get(d.id) ?? null;
    const anchor = anchors.diagram(d.figureNumber ?? 0);
    const caption = `Figure ${d.figureNumber ?? '?'}: ${d.caption}`;

    if (img && img.converted) {
      const headPrefix = headingEmitted ? '' : `${heading}\n\n`;
      headingEmitted = true;
      // Empty-alt image so pandoc does NOT wrap it as an auto-numbered figure
      // (which would prefix a second "Figure N:" that also mismatches our
      // handbook-wide numbering). The caption is rendered manually with our own
      // figure number so it matches the Diagram Index and cross references. The
      // inline anchor span keeps those Diagram Index links working.
      const figureCaption =
        `\\begingroup\\centering\\small\\textbf{${caption}}\\par\\endgroup`;
      parts.push(
        landscape(`${headPrefix}[]{#${anchor}}\n\n![](${img.markdownPath})\n\n${figureCaption}`),
      );
    } else {
      // Portrait note (no landscape, so no clearpage) — the heading is safe here.
      if (!headingEmitted) {
        parts.push(heading, '');
        headingEmitted = true;
      }
      parts.push(`#### ${caption} {#${anchor}}`, '');
      parts.push(
        img
          ? `_Diagram ${d.id} — source: \`${d.relPath}\` (SVG; install rsvg-convert to embed)._`
          : `_Diagram ${d.id} — source: \`${d.relPath}\` (not embedded)._`,
      );
      parts.push('');
    }
  }
  return parts.join('\n');
}

/** Render one spec as a level-2 section with anchored subsections. */
function renderSpec(
  spec: Spec,
  refIndex: ReferenceIndex,
  images: Map<string, DiagramImage | null>,
  mermaidImages: Map<string, DiagramImage | null>,
): string {
  const out: string[] = [];
  out.push(`## ${spec.title} — \`${spec.id}\` {#${anchors.spec(spec.slug)}}`);
  out.push('');
  out.push(`**Version:** ${spec.version} · **Status:** ${spec.status} · **Slug:** \`${spec.slug}\``);
  out.push('');

  const requirements = spec.documents.find((d) => d.kind === 'requirements');
  const design = spec.documents.find((d) => d.kind === 'design');
  const tasks = spec.documents.find((d) => d.kind === 'tasks');

  if (requirements) {
    out.push(`### Requirements {#requirements-${spec.slug}}`);
    out.push('');
    out.push(embedDocument(requirements, spec, refIndex, mermaidImages));
    out.push('');
  }
  if (design) {
    out.push(`### Design {#${anchors.design(spec.slug)}}`);
    out.push('');
    out.push(embedDocument(design, spec, refIndex, mermaidImages));
    out.push('');
  }
  if (tasks) {
    out.push(`### Tasks {#${anchors.tasks(spec.slug)}}`);
    out.push('');
    out.push(embedDocument(tasks, spec, refIndex, mermaidImages));
    out.push('');
  }

  const diag = diagramsSection(spec, images);
  if (diag) {
    out.push(diag);
    out.push('');
  }

  if (spec.references.length > 0) {
    out.push('### Reference Files');
    out.push('');
    for (const r of spec.references) {
      out.push(`- \`${r.relPath}\``);
    }
    out.push('');
  }

  return out.join('\n');
}

/** Build the pandoc YAML metadata block placed at the top of the document. */
function metadataBlock(handbook: Handbook, config: HandbookConfig): string {
  const esc = (s: string): string => s.replace(/"/g, '\\"');
  const lines = [
    '---',
    `title: "${esc(config.title)}"`,
    `subtitle: "${esc(config.subtitle)}"`,
    `author: "${esc(config.organisation)}"`,
    `date: "${handbook.buildDate}"`,
    `revision: "${esc(handbook.revision ?? 'working tree')}"`,
    `papersize: ${config.pdf.paper.toLowerCase()}`,
    `toc-depth: ${config.pdf.toc_depth}`,
    'toc-title: "Table of Contents"',
    `header-spec-id: ${config.pdf.header_shows_spec_id}`,
    'link-citations: true',
    '---',
    '',
  ];
  return lines.join('\n');
}

/**
 * Assemble the complete handbook markdown in the prescribed order.
 * This is pure (no IO) so it can be unit-tested.
 */
export function assembleMarkdown(
  handbook: Handbook,
  config: HandbookConfig,
  parts: HandbookParts,
  images: Map<string, DiagramImage | null>,
  mermaidImages: Map<string, DiagramImage | null> = new Map(),
): string {
  const refIndex = buildReferenceIndex(handbook.specs);
  const sections: string[] = [];

  sections.push(metadataBlock(handbook, config));
  sections.push(parts.documentInfo);
  sections.push(parts.revisionHistory);
  sections.push(parts.architectureOverview);
  if (config.indexes.specs) sections.push(parts.specIndex);
  if (config.indexes.requirements) sections.push(parts.requirementsIndex);
  if (config.indexes.tasks) sections.push(parts.tasksIndex);
  if (config.indexes.diagrams) sections.push(parts.diagramIndex);

  // Steering documents sit before the specifications (they govern them).
  sections.push(parts.steering);

  sections.push('# Specifications\n');
  for (const spec of handbook.specs) {
    sections.push(renderSpec(spec, refIndex, images, mermaidImages));
    if (config.pdf.notes_pages) {
      // `\notespage` is defined by the LaTeX template; ignored by other writers.
      sections.push('\\notespage');
    }
  }

  sections.push(parts.architectureDecisions);
  if (config.traceability.enabled) sections.push(parts.traceability);
  if (config.indexes.changes) sections.push(parts.gitHistory);
  sections.push(parts.appendices);

  // Separate top-level parts with page breaks (raw LaTeX, ignored by other writers).
  return sections
    .filter((s) => s && s.trim().length > 0)
    .join('\n\n\\newpage\n\n');
}

/**
 * Full render pipeline: prepare diagrams, assemble markdown, write it, and invoke
 * pandoc when available. Returns paths and whether a PDF was produced.
 */
export async function render(
  handbook: Handbook,
  config: HandbookConfig,
  parts: HandbookParts,
): Promise<RenderResult> {
  const outputDir = resolveFromRepo(config, config.output.directory);
  mkdirSync(outputDir, { recursive: true });

  const converter = await detectSvgConverter();
  if (!converter) {
    logger.warn(
      'No SVG→PDF converter found (rsvg-convert / inkscape / cairosvg). Diagrams will be listed but not embedded in the PDF.',
    );
  }

  const images = await prepareDiagrams(handbook, outputDir, converter);
  const mermaidImages = await prepareMermaid(handbook, config, outputDir, converter);

  // Resolve `#[[file:*.svg]]` includes in the steering section into embedded figures.
  const resolvedParts: HandbookParts = {
    ...parts,
    steering: await resolveSteeringIncludes(parts.steering, config, outputDir, converter),
  };

  const markdown = assembleMarkdown(handbook, config, resolvedParts, images, mermaidImages);

  const markdownPath = join(outputDir, `${config.output.filename}.md`);
  writeFileSync(markdownPath, markdown, 'utf8');
  logger.success(`Wrote assembled markdown: ${markdownPath}`);

  const pandocAvailable = await isPandocAvailable();
  if (!pandocAvailable) {
    logger.warn(
      'pandoc not found on PATH — skipping PDF generation. Install pandoc + a LaTeX engine (xelatex) to produce the PDF. The assembled markdown above is ready to render.',
    );
    return { markdownPath, pdfPath: null, pandocAvailable: false };
  }

  const pdfPath = join(outputDir, `${config.output.filename}.pdf`);
  await runPandoc(config, markdownPath, pdfPath, outputDir);
  logger.success(`Wrote PDF: ${pdfPath}`);

  // Also publish the PDF at the repository root so it can be committed alongside
  // the code (the canonical, browsable copy of the handbook).
  const rootPdf = join(config.repoRoot, `${config.output.filename}.pdf`);
  if (rootPdf !== pdfPath) {
    copyFileSync(pdfPath, rootPdf);
    logger.success(`Published PDF to repo root: ${rootPdf}`);
  }
  return { markdownPath, pdfPath, pandocAvailable: true };
}

async function isPandocAvailable(): Promise<boolean> {
  try {
    await execa('pandoc', ['--version'], { env: CHILD_ENV });
    return true;
  } catch {
    return false;
  }
}

async function runPandoc(
  config: HandbookConfig,
  markdownPath: string,
  pdfPath: string,
  cwd: string,
): Promise<void> {
  const templatePath = resolveFromTool(config, config.pdf.template);
  const args = [
    basename(markdownPath),
    '-o',
    basename(pdfPath),
    '--from=markdown+raw_tex+fenced_divs+auto_identifiers',
    '--toc',
    `--toc-depth=${config.pdf.toc_depth}`,
    '--pdf-engine=xelatex',
    '--number-sections',
    '--resource-path=.:assets',
  ];
  if (existsSync(templatePath)) {
    args.push(`--template=${templatePath}`);
  } else {
    logger.warn(`LaTeX template not found at ${templatePath}; using pandoc default.`);
    args.push(`-V`, `papersize=${config.pdf.paper.toLowerCase()}`);
  }
  await execa('pandoc', args, { cwd, env: CHILD_ENV });
}
