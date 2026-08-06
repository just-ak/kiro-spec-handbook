import matter from 'gray-matter';
/**
 * Parse YAML front matter from a markdown document.
 *
 * Note: many Kiro specs use `---` as a section divider *within* the body. gray-matter
 * only treats a `---` block at the very start of the file as front matter, so ordinary
 * horizontal rules are left untouched.
 */
export function parseFrontMatter(raw) {
    const parsed = matter(raw);
    return { frontMatter: (parsed.data ?? {}), content: parsed.content };
}
/**
 * Convert a spec directory slug into a stable, uppercase token.
 * `service-charge-reconciliation` -> `SERVICE-CHARGE-RECONCILIATION`.
 */
export function slugToToken(slug) {
    return slug
        .trim()
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toUpperCase();
}
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
export function deriveSpecId(slug, frontMatter) {
    const declared = frontMatter.spec_id;
    if (typeof declared === 'string' && declared.trim().length > 0) {
        return declared.trim();
    }
    return `SPEC-${slugToToken(slug)}`;
}
/** Build a stable requirement id within a spec. */
export function requirementId(specId, number) {
    return `${specId}:R${number}`;
}
/** Build a stable task id within a spec. */
export function taskId(specId, number) {
    return `${specId}:T${number}`;
}
/** Build a stable diagram id within a spec (figure numbers are assigned separately). */
export function diagramId(specId, index) {
    const token = specId.replace(/^SPEC-/, '');
    return `FIG-${token}-${index}`;
}
/** Generic document H1s that carry no spec-specific meaning. */
const GENERIC_H1 = /^(requirements|design|implementation plan|tasks|technical design)( document)?$/i;
function titleCaseSlug(slug) {
    return slug
        .split(/[-_]/)
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}
/**
 * Pick the best available human title for a spec.
 *
 * Precedence: front matter `title` → a meaningful H1 → the title-cased slug.
 * Generic H1s such as "Requirements Document" are ignored in favour of the slug,
 * because Kiro specs conventionally start every requirements.md with that heading.
 */
export function resolveTitle(slug, frontMatter, h1) {
    if (typeof frontMatter.title === 'string' && frontMatter.title.trim()) {
        return frontMatter.title.trim();
    }
    if (h1 && h1.trim() && !GENERIC_H1.test(h1.trim())) {
        return h1.trim();
    }
    return titleCaseSlug(slug);
}
export function resolveVersion(frontMatter) {
    if (frontMatter.version === undefined || frontMatter.version === null)
        return '—';
    return String(frontMatter.version);
}
export function resolveStatus(frontMatter) {
    if (typeof frontMatter.status === 'string' && frontMatter.status.trim()) {
        return frontMatter.status.trim().toLowerCase();
    }
    return 'unspecified';
}
//# sourceMappingURL=metadata.js.map