import type { SpecFrontMatter } from './types.js';
/**
 * Parse YAML front matter from a markdown document.
 *
 * Note: many Kiro specs use `---` as a section divider *within* the body. gray-matter
 * only treats a `---` block at the very start of the file as front matter, so ordinary
 * horizontal rules are left untouched.
 */
export declare function parseFrontMatter(raw: string): {
    frontMatter: SpecFrontMatter;
    content: string;
};
/**
 * Convert a spec directory slug into a stable, uppercase token.
 * `service-charge-reconciliation` -> `SERVICE-CHARGE-RECONCILIATION`.
 */
export declare function slugToToken(slug: string): string;
/**
 * Derive the stable spec id.
 *
 * Precedence:
 *  1. `spec_id` declared in front matter (authoritative, never changes).
 *  2. Deterministic id derived from the directory slug: `SPEC-<TOKEN>`.
 *
 * Crucially, the derived id depends only on the spec's *directory name*, never on
 * file names, headings, or page numbers — so it is stable across builds forever.
 */
export declare function deriveSpecId(slug: string, frontMatter: SpecFrontMatter): string;
/** Build a stable requirement id within a spec. */
export declare function requirementId(specId: string, number: number): string;
/** Build a stable task id within a spec. */
export declare function taskId(specId: string, number: string): string;
/** Build a stable diagram id within a spec (figure numbers are assigned separately). */
export declare function diagramId(specId: string, index: number): string;
/**
 * Pick the best available human title for a spec.
 *
 * Precedence: front matter `title` → a meaningful H1 → the title-cased slug.
 * Generic H1s such as "Requirements Document" are ignored in favour of the slug,
 * because Kiro specs conventionally start every requirements.md with that heading.
 */
export declare function resolveTitle(slug: string, frontMatter: SpecFrontMatter, h1?: string): string;
export declare function resolveVersion(frontMatter: SpecFrontMatter): string;
export declare function resolveStatus(frontMatter: SpecFrontMatter): string;
