---
spec_id: SPEC-PDF-CHUNKING
title: PDF Chunking
version: "1.0"
status: implemented
---

# Requirements Document

## Introduction

Kiro limits attachments to 4 MB, but a generated handbook is often larger. PDF
chunking splits a large PDF into a sequence of smaller, fully valid PDFs that can
be uploaded individually and read in order. Splitting is page-based so every
chunk opens on its own.

## Requirements

### Requirement 1: Page-based splitting into valid PDFs

**User Story:** As a user uploading to Kiro, I want a large PDF split into
standalone files, so that each one opens and reads correctly on its own.

#### Acceptance Criteria

1. WHEN a PDF exceeds the target chunk size THEN the system SHALL pack whole
   pages into each chunk until adding the next page would exceed the target.
2. WHEN a chunk is written THEN the system SHALL produce a fully valid,
   standalone PDF with correct header, objects, xref table, and trailer.
3. WHEN all pages are distributed THEN the system SHALL preserve the original
   page order across chunks.
4. WHEN the entire PDF already fits within the target THEN the system SHALL emit
   a single `_chunk_1_of_1` file.

### Requirement 2: Configurable and auto-detected size

**User Story:** As a user, I want to choose the chunk size or let the tool pick
one, so that I can balance the number of uploads against the size limit.

#### Acceptance Criteria

1. WHEN a size of 1, 2, 3, or 4 MB is provided THEN the system SHALL use it as
   the per-chunk target.
2. WHEN an invalid size is provided THEN the system SHALL reject it with a clear
   error.
3. WHEN auto-size is requested THEN the system SHALL suggest a size that keeps
   each chunk within Kiro's 4 MB limit.

### Requirement 3: Oversized single pages

**User Story:** As a user, I want the tool to handle a page that is larger than
the target on its own, so that the process does not stall.

#### Acceptance Criteria

1. WHEN a single page exceeds the target size THEN the system SHALL emit that
   page as its own chunk and warn that it is oversized.
2. WHEN emitting an oversized page THEN the system SHALL continue processing the
   remaining pages normally.

### Requirement 4: Predictable naming and dry-run

**User Story:** As a user, I want predictable file names and a preview mode, so
that I can see the plan before writing files.

#### Acceptance Criteria

1. WHEN chunks are created THEN the system SHALL name them
   `<name>_chunk_<i>_of_<N>.pdf`.
2. WHEN dry-run is requested THEN the system SHALL report what would be created
   without writing any files.
3. WHEN chunking completes THEN the system SHALL report total size, chunk size,
   chunk count, and per-chunk page counts and sizes.
