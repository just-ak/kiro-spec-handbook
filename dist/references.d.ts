import type { Spec } from './types.js';
/** Stable anchor helpers. Anchors are deterministic and depend only on slugs/ids. */
export declare const anchors: {
    spec: (slug: string) => string;
    requirement: (slug: string, n: number) => string;
    tasks: (slug: string) => string;
    design: (slug: string) => string;
    diagram: (figureNumber: number) => string;
};
/** Build a lookup of slug + spec id so path/token references can be resolved. */
export interface ReferenceIndex {
    bySlug: Map<string, Spec>;
    byId: Map<string, Spec>;
}
export declare function buildReferenceIndex(specs: Spec[]): ReferenceIndex;
/**
 * Inject explicit, collision-free anchors onto `### Requirement N:` headings so
 * cross references resolve deterministically across specs.
 */
export declare function injectRequirementAnchors(content: string, slug: string): string;
/**
 * Turn `_Requirements: 4.3, 5.1_` lines inside a tasks document into clickable
 * links to the referenced requirement headings within the same spec.
 */
export declare function linkifyRequirementRefs(content: string, slug: string): string;
/**
 * Rewrite inline `.kiro/specs/<slug>/<doc>.md` path mentions into links to the
 * relevant section within the handbook. Unknown slugs are left untouched.
 */
export declare function linkifySpecPaths(content: string, index: ReferenceIndex): string;
