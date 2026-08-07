---
spec_id: SPEC-HANDBOOK-GENERATION
title: Handbook Generation
version: "1.0"
status: implemented
---

# Requirements Document

## Introduction

The handbook generation pipeline is the core of `kiro-spec-handbook`. It
discovers Kiro specifications on disk, parses them into a stable in-memory
model, builds cross-referenced indexes, and assembles a single Markdown document
that is rendered to a professionally formatted PDF via Pandoc and LaTeX. The
pipeline is deterministic and degrades gracefully when optional tooling is
absent.

## Requirements

### Requirement 1: Spec discovery and parsing

**User Story:** As a spec author, I want the tool to automatically discover and
parse every specification in my project, so that I do not have to register files
manually.

#### Acceptance Criteria

1. WHEN the tool runs THEN the system SHALL treat each immediate subdirectory of
   the configured specs root as one specification.
2. WHEN a spec directory contains `requirements.md`, `design.md`, or `tasks.md`
   THEN the system SHALL classify and parse each document by its kind.
3. WHEN a spec contains `references/**` files THEN the system SHALL record them
   as reference files without treating them as primary documents.
4. WHEN a directory contains no markdown and no SVG files THEN the system SHALL
   skip it.
5. WHEN discovery completes THEN the system SHALL return specs sorted by their
   stable id.

### Requirement 2: Stable identifiers

**User Story:** As a reviewer, I want identifiers that never change between
builds, so that references remain valid over time.

#### Acceptance Criteria

1. WHEN a spec declares `spec_id` in front matter THEN the system SHALL use that
   value as the authoritative id.
2. WHEN no `spec_id` is declared THEN the system SHALL derive the id from the
   directory slug as `SPEC-<TOKEN>`.
3. WHEN assigning requirement, task, and diagram ids THEN the system SHALL derive
   them from the spec id plus the in-document number.
4. WHEN filenames, headings, or page numbers change THEN the system SHALL NOT
   change any derived identifier.

### Requirement 3: Indexes and cross-references

**User Story:** As a reader, I want indexes and working cross-references, so that
I can navigate a large handbook quickly.

#### Acceptance Criteria

1. WHEN indexes are enabled THEN the system SHALL emit specification,
   requirements, tasks, and diagram indexes.
2. WHEN a task references a requirement THEN the system SHALL render a hyperlink
   to that requirement's anchor.
3. WHEN traceability is enabled THEN the system SHALL emit a traceability matrix
   linking requirements to the tasks that implement them.
4. WHEN diagrams are present THEN the system SHALL assign sequential,
   handbook-wide figure numbers in document order.

### Requirement 4: Deterministic assembly

**User Story:** As a CI maintainer, I want identical inputs to produce identical
output, so that builds are reproducible.

#### Acceptance Criteria

1. WHEN assembling the document THEN the system SHALL order sections
   deterministically and separate top-level parts with page breaks.
2. WHEN computing the build date THEN the system SHALL use `config.build_date`,
   then `SOURCE_DATE_EPOCH`, then the last git commit date, in that order.
3. WHEN hashing a spec THEN the system SHALL produce a stable content hash over
   its source files, independent of platform path separators.

### Requirement 5: Graceful degradation

**User Story:** As a first-time user, I want the tool to work on a fresh
checkout, so that missing optional tooling does not block me.

#### Acceptance Criteria

1. WHEN Pandoc is not installed THEN the system SHALL still write the assembled
   Markdown and report that the PDF step was skipped.
2. WHEN no SVG converter is available THEN the system SHALL list diagrams by
   reference rather than failing.
3. WHEN `mmdc` is not installed THEN the system SHALL render mermaid blocks as
   fenced code rather than failing.
4. WHEN the configuration file is absent THEN the system SHALL apply built-in
   defaults.
