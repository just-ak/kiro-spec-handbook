/** Stable anchor helpers. Anchors are deterministic and depend only on slugs/ids. */
export const anchors = {
    spec: (slug) => `spec-${slug}`,
    requirement: (slug, n) => `req-${slug}-${n}`,
    tasks: (slug) => `tasks-${slug}`,
    design: (slug) => `design-${slug}`,
    diagram: (figureNumber) => `fig-${figureNumber}`,
};
export function buildReferenceIndex(specs) {
    const bySlug = new Map();
    const byId = new Map();
    for (const s of specs) {
        bySlug.set(s.slug, s);
        byId.set(s.id, s);
    }
    return { bySlug, byId };
}
/**
 * Inject explicit, collision-free anchors onto `### Requirement N:` headings so
 * cross references resolve deterministically across specs.
 */
export function injectRequirementAnchors(content, slug) {
    return content.replace(/^(#{2,4})\s+Requirement\s+(\d+)\s*:\s*(.+?)\s*$/gm, (_full, hashes, num, title) => `${hashes} Requirement ${num}: ${title} {#${anchors.requirement(slug, Number(num))}}`);
}
/**
 * Turn `_Requirements: 4.3, 5.1_` lines inside a tasks document into clickable
 * links to the referenced requirement headings within the same spec.
 */
export function linkifyRequirementRefs(content, slug) {
    return content.replace(/_Requirements:\s*([^_]+)_/gi, (_full, list) => {
        const links = list
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean)
            .map((ref) => {
            const reqNum = Number.parseInt(ref, 10);
            if (Number.isNaN(reqNum))
                return ref;
            return `[${ref}](#${anchors.requirement(slug, reqNum)})`;
        });
        return `_Requirements: ${links.join(', ')}_`;
    });
}
const SPECS_PATH = /\.kiro\/specs\/([a-z0-9][a-z0-9-]*)\/(requirements|design|tasks)\.md/gi;
/**
 * Rewrite inline `.kiro/specs/<slug>/<doc>.md` path mentions into links to the
 * relevant section within the handbook. Unknown slugs are left untouched.
 */
export function linkifySpecPaths(content, index) {
    return content.replace(SPECS_PATH, (full, slug, doc) => {
        if (!index.bySlug.has(slug))
            return full;
        const anchor = doc === 'tasks'
            ? anchors.tasks(slug)
            : doc === 'design'
                ? anchors.design(slug)
                : anchors.spec(slug);
        return `[${full}](#${anchor})`;
    });
}
//# sourceMappingURL=references.js.map