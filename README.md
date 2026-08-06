# kiro-handbook

AWS Kiro Specification Handbook Publisher — converts Kiro specifications into a professionally indexed
PDF handbook suitable for printing, handwritten review, and reading on a reMarkable tablet.

A `just-ak` tool for anyone building and documenting specs using AWS Kiro.

This is a **GitHub Package** available at [`@just-ak/kiro-handbook`](https://github.com/just-ak/kiro-handbooks/packages).
Use it in your own Kiro spec projects to generate handbooks from your specifications.

The handbook is **always generated from source**. Never edit the generated output by
hand — your spec markdown files remain the single source of truth.

## Quick Start

```bash
# Install from GitHub Packages
npm install @just-ak/kiro-handbook

# Generate a handbook
handbook build

# Split for upload
handbook chunk
```

**👉 [View full usage guide](./USAGE.md) | [GitHub Packages setup](./GITHUB_PACKAGES.md)**

## Features

- Indexed PDF handbook from Kiro specifications
- Automatic SVG diagram and mermaid rendering
- Cross-referenced requirements, tasks, and specifications
- **PDF chunking for Kiro upload** (supports 4MB attachment limit)
- Deterministic builds for CI/CD
- Change detection via lock file
- Architecture overview and traceability matrix

## Install

The tool is a GitHub Package (`@just-ak/kiro-handbook`). From the repository root:

```bash
npm install
```

To produce the PDF you also need [Pandoc](https://pandoc.org) and a LaTeX engine
(`xelatex`, e.g. from TeX Live or MacTeX). Without them the tool still runs and emits
the assembled Markdown; it just skips the PDF step. To embed the SVG diagrams in the
PDF you also need one of `rsvg-convert` (librsvg), `inkscape`, or `cairosvg`.

`mermaid` code blocks in specs are rendered to figures using
[`@mermaid-js/mermaid-cli`](https://github.com/mermaid-js/mermaid-cli) (`mmdc`), which is
a dev dependency of this workspace (it bundles a headless Chromium). If `mmdc` is missing,
mermaid blocks are shown as code instead. A conservative sanitiser repairs common
authoring issues (semicolons in sequence-message text, unquoted `subgraph` titles) at
render time — the specs on disk are never modified.

```bash
# macOS
brew install pandoc librsvg
# A LaTeX engine — either MacTeX or the lighter TinyTeX:
brew install --cask mactex-no-gui
# or: curl -sL https://yihui.org/tinytex/install-bin-unix.sh | sh
```

The tool automatically discovers a LaTeX engine even when it is not on your shell
`PATH` — it looks in TinyTeX (`~/Library/TinyTeX`, `~/.TinyTeX`), MacTeX
(`/Library/TeX/texbin`), and TeX Live locations, plus Homebrew. So `yarn handbook build`
works right after installing TinyTeX without any shell configuration.

If you use TinyTeX, the required LaTeX packages are:

```bash
tlmgr install fontspec geometry fancyhdr booktabs longtable xcolor titlesec \
  parskip iftex hyperref pgf caption etoolbox footnotehyper ulem setspace \
  unicode-math lm lm-math amsmath amsfonts
```

## Commands

Run via the root scripts (works with `npm run` or `yarn`):

```bash
yarn handbook build        # scan specs -> assembled markdown + PDF + lock file
yarn handbook validate     # validate metadata + cross references (non-zero on errors)
yarn handbook index        # print spec / requirement / task / diagram indexes
yarn handbook changes      # report specs changed since the last build (via lock file)
yarn handbook chunk        # split PDF into chunks for Kiro upload (4MB per chunk)
```

With npm the pass-through form is:

```bash
npm run handbook -- build
npm run handbook:validate
npm run handbook:index
npm run handbook:changes
npm run handbook:chunk
```

### PDF Chunking (New)

Split the generated PDF into 1–4 MB chunks suitable for Kiro's 4MB attachment limit:

```bash
# Auto-detect optimal chunk size
yarn handbook chunk

# Or specify a size explicitly
yarn handbook chunk --size 3                    # 3 MB chunks
yarn handbook chunk --size 4 --output ./chunks  # 4 MB chunks in custom dir
yarn handbook chunk --dry-run                   # Preview without creating files

# Standalone usage
yarn chunk handbook.pdf --auto-size
yarn chunk handbook.pdf --size 2
```

For detailed workflow instructions, see [PDF Chunking Guide](../../docs/guides/pdf-chunking-workflow.md) and [PDF_CHUNKER.md](./PDF_CHUNKER.md).

Useful flags:

```bash
yarn handbook build --allow-warnings           # (default) build despite metadata warnings
yarn handbook index --out docs/handbook/index.md
yarn handbook changes --since v1.2.0           # also list spec files changed since a git ref
handbook --config path/to/handbook.yml build   # use an alternate config
yarn handbook chunk --auto-size                # auto-detect chunk size based on PDF
```

## Configuration

Configuration lives in [`.kiro/handbook.yml`](../../.kiro/handbook.yml). It controls the
title, source/output paths, PDF options (A4, notes pages, LaTeX template, TOC depth),
which indexes to emit, traceability, and git history depth. Sensible defaults apply when
the file or individual keys are absent.

## How it works

```
.kiro/specs/**            scanner.ts    ->  parsed Spec model (requirements, tasks, diagrams)
   requirements.md        markdown.ts   ->  requirements + tasks + requirement links
   design.md              metadata.ts   ->  stable spec IDs + front matter
   tasks.md               diagrams.ts   ->  SVG discovery + figure numbering
   *.svg                  indexer.ts    ->  spec / requirement / task / diagram indexes
                          references.ts ->  cross-reference hyperlinks + anchors
                          git.ts        ->  revision history + change log
                          renderer.ts   ->  assembled Markdown + Pandoc/LaTeX -> PDF
                          pdf-chunker.ts -> split PDF into 1-4 MB chunks
                          lock.ts       ->  handbook.lock.json (delta detection)
```

### Stable identifiers

Every spec has a **stable ID** that never depends on filenames or page numbers:

1. If a spec markdown file declares `spec_id` in YAML front matter, that value is used.
2. Otherwise the ID is derived deterministically from the spec's **directory name**:
   `service-charge-reconciliation` → `SPEC-SERVICE-CHARGE-RECONCILIATION`.

Requirement, task, and diagram IDs are derived from the spec ID plus their in-document
number (`SPEC-STATEMENTS:R3`, `SPEC-STATEMENTS:T4.1`, `FIG-STATEMENTS-2`).

### Front matter

Optional, recognised on any spec markdown file:

```yaml
---
spec_id: SPEC-RESERVE-001
title: Reserve Funds
version: "1.0" # quote versions so YAML preserves "1.0" (not 1)
status: draft
---
```

`---` used as a section divider _inside_ a document is left untouched — only a block at
the very top of the file is treated as front matter.

### Generated handbook structure

Cover → Document Information → Revision History → Table of Contents → Architecture
Overview → Specification Index → Requirements Index → Tasks Index → Diagram Index →
Specifications → Architecture Decisions → Traceability Matrix → Git Change History →
Appendices.

The PDF is A4, set in the Roboto sans-serif family, with a clickable TOC, PDF bookmarks,
searchable text, per-page headers carrying the spec ID, and a footer with revision +
build date. SVG diagrams and rendered mermaid diagrams are embedded as figures, and the
(large) Tasks Index is typeset at 8pt. Interleaved lined "notes" pages for handwritten
review are available via `pdf.notes_pages: true` in the config (off by default).

### Determinism

Builds are deterministic: specs are sorted by ID, content hashes are stable, and the
build date is taken from `config.build_date`, `SOURCE_DATE_EPOCH`, or the last git commit
date (in that order). This makes the output repeatable in CI.

### `handbook.lock.json`

After every build a lock file is written to the output directory containing, per spec:
`spec_id`, `title`, `content_hash`, `last_published`, and `last_page`. The next build
compares content hashes to report what was **added / changed / removed**, enabling future
delta printing (only reprint the specs that changed). `last_published` advances only when
a spec's content actually changes.

## Tests

```bash
npm run -w kiro-handbook test
```

Unit tests cover ID derivation, markdown parsing, cross references, indexing, validation,
the lock/delta logic, Markdown assembly, and PDF chunking. An integration test drives the
scanner over a temporary fixture spec tree.

## Contributing & Publishing

This is an open-source npm package. Contributions are welcome.

- **For users**: See [USAGE.md](./USAGE.md) for how to use this package
- **For contributors**: See [PUBLISHING.md](./PUBLISHING.md) for release process and how to publish updates
