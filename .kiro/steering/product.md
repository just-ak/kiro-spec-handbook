# Product

`kiro-spec-handbook` converts AWS Kiro specifications into a professionally
formatted, indexed PDF handbook. The handbook is meant to be printed or read on
a tablet (reMarkable, iPad), annotated by hand, and then fed back into the
project so the notes can be processed into spec changes.

## Who it is for

Teams and individuals who build software with Kiro specs and want a durable,
reviewable artifact of their specifications — one that works away from the
screen and supports collaborative, handwritten review.

## Core value

- A single, indexed document assembled from many spec files.
- Stable identifiers for specs, requirements, tasks, and diagrams that never
  depend on filenames or page numbers.
- Deterministic builds suitable for CI and version control.
- PDF chunking so large handbooks fit within Kiro's 4 MB attachment limit.
- A tokenizer summary that surfaces bloat in specs and steering docs.

## Guiding principles

- **Source of truth is the specs.** The handbook is always generated; never edit
  the output by hand.
- **Determinism first.** Same inputs produce the same bytes. Sort by stable id,
  hash content, and derive the build date from git or `SOURCE_DATE_EPOCH`.
- **Degrade gracefully.** If Pandoc, LaTeX, an SVG converter, or `mmdc` is
  missing, still produce useful Markdown rather than failing hard.
- **The tool works on a fresh checkout.** Sensible defaults apply when config or
  optional tooling is absent.
