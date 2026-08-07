# Project Structure

## Layout

```
kiro-spec-handbook/
├── src/                    # TypeScript source (one module per concern)
├── test/                   # vitest suites + shared fixtures
├── templates/              # LaTeX template (handbook.latex)
├── examples/               # Sample PDFs used for chunking demos
├── .kiro/
│   ├── specs/              # This project's own specifications (dogfooding)
│   ├── steering/           # Project-wide rules (this folder)
│   └── handbook.yml        # Handbook build configuration
└── dist/                   # Compiled output (published, git-ignored)
```

## Module map (`src/`)

The pipeline modules, in the order data flows through them:

- `config.ts` — load + normalise `handbook.yml`; locate repo/tool roots.
- `scanner.ts` — discover specs, parse documents, compute content hashes.
- `markdown.ts` — parse requirement/task headings; derive captions.
- `metadata.ts` — front matter parsing and stable id derivation.
- `diagrams.ts` — SVG discovery and handbook-wide figure numbering.
- `indexer.ts` — spec/requirement/task/diagram indexes + traceability matrix.
- `references.ts` — cross-reference anchors and hyperlinks.
- `sections.ts` — document info, architecture, steering, appendices, tokenizer.
- `tokenizer.ts` — deterministic per-model token estimation.
- `changelog.ts` + `git.ts` — revision history and change log from git.
- `renderer.ts` — assemble Markdown and drive Pandoc/LaTeX to PDF.
- `lock.ts` — `handbook.lock.json` for delta detection between builds.
- `pdf-chunker.ts` + `pdf-chunker-cli.ts` — split PDFs for Kiro upload.
- `index.ts` — CLI entry (`handbook` command).

## Spec authoring conventions

Each spec is a directory under `.kiro/specs/<slug>/` containing:

- `requirements.md` — `### Requirement N: Title` headings (EARS acceptance
  criteria beneath). This file's front matter/H1 is the canonical spec metadata.
- `design.md` — the technical design.
- `tasks.md` — `- [x] N. Title` checkboxes, each linking `_Requirements: x.y_`.
- `diagrams/*.svg` — architecture diagrams (SVG only — see `diagramming.md`).
- `references/**` — supporting files listed in the appendix.

Optional front matter (recognised only at the top of a file):

```yaml
---
spec_id: SPEC-EXAMPLE-001 # authoritative id; otherwise derived from the slug
title: Example Feature
version: "1.0" # quote versions so YAML keeps "1.0"
status: draft
---
```

Identifiers are stable: spec ids derive from the directory name, and
requirement/task/diagram ids derive from the spec id plus their in-document
number (`SPEC-EXAMPLE-001:R3`, `:T4.1`, `FIG-EXAMPLE-001-2`).
