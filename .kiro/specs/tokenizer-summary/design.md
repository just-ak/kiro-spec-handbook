# Design

## Overview

Token estimation lives in `tokenizer.ts` (pure counting + model profiles) and is
rendered into the handbook by `tokenSummary()` in `sections.ts`, which is folded
into the Appendices as Appendix B.

## Why a heuristic, not a real tokenizer

Exact tokenization needs model-specific BPE vocabularies (tiktoken for GPT,
Anthropic's tokenizer for Claude). These are heavy and network-fetched, which
would break the tool's deterministic, offline-friendly builds. Instead we use the
well-established characters-per-token heuristic with per-model ratios that can be
overridden in config. The result is stable and dependency-free — accurate enough
to compare documents and track bloat, and clearly labelled as an estimate.

## Model profiles

`TokenizerProfile { key, label, charsPerToken }`. Built-ins:

- Claude family (`opus-4.8`, `sonnet-4.5`, `haiku`) ≈ 3.5 chars/token.
- GPT family (`gpt-4o`, `gpt-4`, `gpt-3.5-turbo`) ≈ 4.0 chars/token.

`resolveProfile(key, overrides)` applies a `chars_per_token` override and falls
back to a generic ~4.0 profile for unknown keys. `resolveProfiles([])` defaults
to `opus-4.8`.

## Counting

`countTokens(text, profile)` normalises `\r\n` → `\n`, collapses whitespace
runs, then divides the character length by the profile ratio (min 1 for non-empty
content). `countChars` and `countWords` support the table's other columns.

## Rendering

`tokenSummary(handbook, config)`:

1. Returns `''` when `config.tokenizer.enabled` is false.
2. Resolves the configured profiles.
3. Builds a row per spec (all documents concatenated) and per steering document
   (front matter stripped).
4. Emits two tables (Specifications, Steering Documents), each sorted
   largest-first by the primary model, with a bold totals row.

`appendices(handbook, extra[])` accepts the rendered summary and appends it after
Appendix A so it nests cleanly under the Appendices heading.

## Testing Strategy

Unit tests cover platform-stable counting, the Claude-vs-GPT density difference,
profile resolution and overrides, the empty/disabled cases, and that the summary
renders under Appendices as Appendix B.
