---
spec_id: SPEC-TOKENIZER-SUMMARY
title: Tokenizer Summary
version: "1.0"
status: implemented
---

# Requirements Document

## Introduction

Specs and steering documents are consumed by LLMs with finite context windows.
The tokenizer summary appendix estimates token counts for every spec and steering
document across configurable models, so authors can spot and trim bloat. Counts
are deterministic, offline approximations — good enough to compare documents and
track growth over time.

## Requirements

### Requirement 1: Per-model token estimation

**User Story:** As a spec author, I want token estimates for the models I use, so
that I can see how my documents fit different context budgets.

#### Acceptance Criteria

1. WHEN a model is configured THEN the system SHALL estimate tokens using a
   characters-per-token ratio for that model.
2. WHEN counting THEN the system SHALL normalise line endings and collapse
   whitespace so counts are identical across platforms.
3. WHEN content is empty THEN the system SHALL report zero tokens; WHEN content
   is non-empty THEN the estimate SHALL be at least one.

### Requirement 2: Configurable models

**User Story:** As a user, I want to choose which models appear and tune their
ratios, so that the table matches my toolchain.

#### Acceptance Criteria

1. WHEN model keys are configured THEN the system SHALL render one column per
   model in the summary tables.
2. WHEN a `chars_per_token` override is provided THEN the system SHALL use it in
   place of the built-in ratio.
3. WHEN an unknown model key is provided THEN the system SHALL fall back to a
   generic ratio rather than failing.
4. WHEN no models are configured THEN the system SHALL default to a single model.

### Requirement 3: Summary appendix

**User Story:** As a reviewer, I want a summary table in the handbook, so that
bloat is visible at a glance.

#### Acceptance Criteria

1. WHEN the tokenizer is enabled THEN the system SHALL emit an "Appendix B —
   Tokenizer Summary" containing a specifications table and a steering table.
2. WHEN building a table THEN the system SHALL include characters, words, and a
   token count per model, and a totals row.
3. WHEN ordering rows THEN the system SHALL sort largest-first by the primary
   model's token count so the biggest documents surface first.
4. WHEN the tokenizer is disabled THEN the system SHALL emit no summary.
