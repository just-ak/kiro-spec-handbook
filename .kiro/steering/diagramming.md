# Diagramming

## Rule: architecture diagrams are always SVG

All architecture diagrams committed to a spec **must be authored as SVG** and
placed in the spec's `diagrams/` folder (or at the spec root). This is a hard
requirement, not a preference.

### Why SVG

- **Vector, not raster.** SVGs stay crisp at any print size and on high-DPI
  tablets — essential for a handbook meant to be printed and annotated.
- **Diff-able and reviewable.** SVG is text (XML), so diagram changes show up in
  version control and code review like any other source.
- **First-class in the pipeline.** The scanner discovers `*.svg` automatically,
  assigns each a stable `FIG-*` id and a handbook-wide figure number, and the
  renderer converts SVG → PDF (via `rsvg-convert`/`inkscape`/`cairosvg`) to embed
  them as full landscape figures.
- **Deterministic.** Text-based sources hash cleanly and reproduce identically
  across builds.

### Authoring guidelines

- Name files descriptively; the file name becomes the figure caption
  (`pipeline.svg` → "Pipeline", `chunking-flow.svg` → "Chunking Flow").
- Prefer a landscape aspect ratio (e.g. `viewBox="0 0 1200 700"`); diagrams are
  placed on their own landscape page.
- Set an explicit `viewBox` and use readable font sizes (≥ 14px in diagram units).
- Keep text as real `<text>` elements (not outlined paths) so it stays searchable
  and legible.
- Use a restrained palette and label every node and edge.

### Mermaid is the exception, not the rule

Inline `mermaid` code blocks in requirements/design/tasks are supported and
rendered to SVG at build time (via `mmdc`) for convenience. But the **canonical
architecture diagrams** — the ones that define the system — should be committed
as hand-maintained SVG files so they are stable, reviewable, and never depend on
an optional renderer being installed.
