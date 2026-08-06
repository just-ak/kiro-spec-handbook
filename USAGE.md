# Using @just-ak/kiro-handbook

This guide explains how to use the `@just-ak/kiro-handbook` package in your own Kiro spec projects.

## Installation

First, ensure you're authenticated with GitHub Packages (see [GITHUB_PACKAGES.md](./GITHUB_PACKAGES.md)).

Then install:

```bash
npm install @just-ak/kiro-handbook
```

````

You'll also need to install the optional system dependencies to generate PDFs:

### macOS

```bash
brew install pandoc librsvg xelatex
````

Or for a lighter LaTeX setup (TinyTeX):

```bash
curl -sL https://yihui.org/tinytex/install-bin-unix.sh | sh
```

### Linux (Ubuntu/Debian)

```bash
apt-get install pandoc librsvg2-bin texlive-xetex texlive-fonts-recommended
```

### Windows

- [Pandoc](https://pandoc.org/installing.html)
- [Librsvg](https://github.com/miyagawa/librsvg-windows)
- [MiKTeX](https://miktex.org/download) or [TinyTeX](https://yihui.org/tinytex/)

## CLI Usage

Once installed, two CLI tools become available: `handbook` and `pdf-chunker`.

### handbook

Build and manage your specification handbook:

```bash
# Build handbook (scan specs → markdown → PDF)
handbook build

# Validate specifications (metadata, cross-references)
handbook validate

# Show spec, requirement, task, and diagram indexes
handbook index

# Report which specs changed since the last build
handbook changes

# Split PDF into chunks for uploading
handbook chunk
```

### pdf-chunker

Standalone utility to chunk any PDF:

```bash
# Auto-detect optimal chunk size
pdf-chunker handbook.pdf --auto-size

# Specify a chunk size (MB)
pdf-chunker handbook.pdf --size 3

# Preview without creating files
pdf-chunker handbook.pdf --size 2 --dry-run

# Custom output directory
pdf-chunker handbook.pdf --size 4 --output ./my-chunks
```

## Library Usage

Import functions directly from the package to integrate handbook generation into your build pipeline:

```typescript
import {
  loadSpecifications,
  renderHandbook,
  generateIndexes,
  validateReferences,
  chunkPdf,
} from "@just-ak/kiro-handbook";
```

### Load specifications

Scan a directory for spec markdown files:

```typescript
import { loadSpecifications } from "@just-ak/kiro-handbook";

const specs = await loadSpecifications("./specs");
console.log(specs);
// {
//   specifications: [{ id, title, markdown, ... }, ...],
//   diagrams: [{ id, filename, ... }, ...],
//   requirements: [{ id, title, spec_id, ... }, ...],
//   tasks: [{ id, title, spec_id, ... }, ...],
// }
```

### Validate references

Check that cross-references are valid:

```typescript
import { validateReferences } from "@just-ak/kiro-handbook";

const errors = await validateReferences(specs);
if (errors.length > 0) {
  console.error("Validation failed:", errors);
  process.exit(1);
}
```

### Generate indexes

Create specification, requirement, task, and diagram indexes:

```typescript
import { generateIndexes } from "@just-ak/kiro-handbook";

const indexes = generateIndexes(specs);
console.log(indexes);
// {
//   specifications: "# Specification Index\n...",
//   requirements: "# Requirements Index\n...",
//   tasks: "# Tasks Index\n...",
//   diagrams: "# Diagrams Index\n...",
// }
```

### Render handbook

Assemble markdown and optionally generate PDF:

```typescript
import { renderHandbook } from "@just-ak/kiro-handbook";

const handbook = await renderHandbook(specs, {
  title: "My Handbook",
  outputDir: "./handbook",
  generatePdf: true,
});

console.log(handbook);
// {
//   markdown: "# My Handbook\n...",
//   pdfPath: "./handbook/handbook.pdf",
//   buildDate: "2024-01-15T10:30:00Z",
//   stats: { specsCount: 12, requirementsCount: 45, ... },
// }
```

### Chunk PDF

Split a large PDF into smaller files:

```typescript
import { chunkPdf } from "@just-ak/kiro-handbook";

const chunks = await chunkPdf("./handbook.pdf", {
  maxSizeMb: 4,
  outputDir: "./chunks",
});

console.log(chunks);
// [
//   { file: './chunks/handbook-1.pdf', sizeMb: 3.8 },
//   { file: './chunks/handbook-2.pdf', sizeMb: 2.1 },
// ]
```

## Configuration

Create a `handbook.yml` file to customize behavior (optional — sensible defaults apply):

```yaml
# handbook.yml
source_dir: "./specs"
output_dir: "./handbook"
title: "My Handbook"

pdf:
  paper_size: A4
  font: "Roboto"
  notes_pages: false
  toc_depth: 2
  pandoc_args: []

indexes:
  specifications: true
  requirements: true
  tasks: true
  diagrams: true

git:
  include_history: true
  history_depth: 100
```

Pass the config file to CLI:

```bash
handbook --config ./handbook.yml build
```

Or to the library:

```typescript
const handbook = await renderHandbook(specs, {
  configFile: "./handbook.yml",
});
```

## Example: Build pipeline integration

```typescript
import {
  loadSpecifications,
  validateReferences,
  renderHandbook,
} from "@just-ak/kiro-handbook";

async function buildHandbook() {
  console.log("📖 Loading specifications...");
  const specs = await loadSpecifications("./specs");

  console.log("✓ Checking references...");
  const errors = await validateReferences(specs);
  if (errors.length > 0) {
    console.error("❌ Validation failed:", errors);
    process.exit(1);
  }

  console.log("📝 Rendering handbook...");
  const handbook = await renderHandbook(specs, {
    title: "Product Handbook",
    outputDir: "./dist",
    generatePdf: true,
  });

  console.log(`✅ Built successfully!`);
  console.log(`   Markdown: ${handbook.markdown.length} chars`);
  console.log(`   PDF: ${handbook.pdfPath}`);
  console.log(`   Specs: ${handbook.stats.specsCount}`);
  console.log(`   Requirements: ${handbook.stats.requirementsCount}`);
  console.log(`   Tasks: ${handbook.stats.tasksCount}`);
}

buildHandbook();
```

## Types

Full TypeScript types are included. Key interfaces:

```typescript
interface Specification {
  id: string;
  title: string;
  version?: string;
  status?: "draft" | "review" | "approved" | "archived";
  markdown: string;
  requirements: Requirement[];
  tasks: Task[];
  diagrams: Diagram[];
  lastModified: Date;
}

interface Requirement {
  id: string;
  spec_id: string;
  number: number;
  title: string;
  markdown: string;
}

interface Task {
  id: string;
  spec_id: string;
  number: string; // e.g., "4.1.2"
  title: string;
  markdown: string;
  completed: boolean;
}

interface Diagram {
  id: string;
  spec_id: string;
  number: number;
  filename: string;
  format: "svg" | "mermaid" | "png";
}
```

## Troubleshooting

### "Cannot find pandoc"

The handbook will skip PDF generation if Pandoc is not installed. Install it with your system package manager. The tool will continue working and emit Markdown.

### "Mermaid render failed"

Mermaid diagrams require `mmdc` (Mermaid CLI). The package includes it as a dev dependency, but you may need to install Chromium/Chrome separately on some systems.

### "Cannot find LaTeX"

The tool automatically searches for LaTeX in common locations (TinyTeX, MacTeX, TeX Live, Homebrew). If it still can't find it, set `PATH` explicitly or install via your system package manager.

### "Cross-reference validation failed"

Check that requirement/task IDs in your specs match requirements/tasks referenced elsewhere. Use `handbook validate` to see specific errors.

## Examples

See the repository for full examples:

- [`README.md`](./README.md) — overview and full command reference
- [`PUBLISHING.md`](./PUBLISHING.md) — how to publish new versions
- `test/` — unit test examples

## Support

- Issues: https://github.com/just-ak/kiro-handbooks/issues
- Docs: https://github.com/just-ak/kiro-handbooks
