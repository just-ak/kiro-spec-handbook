# Technology

## Stack

- **Language:** TypeScript (ES2022, `NodeNext` modules), compiled with `tsc`.
- **Runtime:** Node.js ≥ 20. Distributed as ESM (`"type": "module"`).
- **CLI:** [commander](https://github.com/tj/commander.js) exposes two binaries —
  `handbook` and `pdf-chunker`.
- **Testing:** [vitest](https://vitest.dev). Run once with `vitest run`.

## Key libraries

- `globby` — spec/file discovery.
- `gray-matter` + `js-yaml` — front matter and config parsing.
- `pdf-lib` — reading and splitting PDFs for chunking.
- `execa` — invoking external tools (Pandoc, SVG converters, `mmdc`).
- `chalk` — CLI logging.

## External tools (optional, degrade gracefully)

- **Pandoc + XeLaTeX** — render assembled Markdown to PDF. Absent → emit Markdown.
- **rsvg-convert / inkscape / cairosvg** — convert SVG → PDF for embedding.
- **@mermaid-js/mermaid-cli (`mmdc`)** — render mermaid blocks to SVG.

The renderer discovers TinyTeX/MacTeX/TeX Live and Homebrew locations even when
they are not on `PATH`, so builds work right after a TinyTeX install.

## Commands

```bash
npm run build          # tsc -> dist/
npm run test           # vitest run
npm run handbook       # run the CLI via tsx (e.g. npm run handbook -- build)
npm run chunk          # run the pdf-chunker CLI via tsx
```

CLI subcommands: `handbook build | validate | index | changes | chunk`.

## Release

Automated with semantic-release on push to `main`. Commits follow Conventional
Commits (`feat:`, `fix:`, `perf:`, `refactor:`, breaking with `!`). Version,
changelog, git tag, and GitHub Packages publish are all handled by CI.

## Conventions

- Prefer pure, testable functions; keep IO at the edges (e.g. `assembleMarkdown`
  is pure so it can be unit-tested).
- Everything user-visible must be deterministic across platforms — normalise
  path separators to POSIX and line endings to `\n`.
- Never fail the build for missing optional tooling; warn and continue.
