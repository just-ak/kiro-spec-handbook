import type { RequirementRef, TaskRef } from './types.js';
/** Extract the first level-1 heading (used as a fallback spec title). */
export declare function extractH1(content: string): string | undefined;
/** Parse `### Requirement N: Title` headings from a requirements document. */
export declare function parseRequirements(specId: string, content: string): RequirementRef[];
/**
 * Parse checkbox tasks from a tasks document, associating each with any
 * `_Requirements: a.b, c.d_` references that appear in the following lines
 * (before the next task line).
 */
export declare function parseTasks(specId: string, content: string): TaskRef[];
/** Human-readable caption derived from an SVG file name. */
export declare function captionFromFileName(fileName: string): string;
