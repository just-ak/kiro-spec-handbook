import type { Handbook, HandbookConfig } from './types.js';
/** Cover-adjacent "Document Information" section with build provenance. */
export declare function documentInfo(handbook: Handbook, config: HandbookConfig): string;
/** Architecture overview — links to the architecture spec and repo docs if present. */
export declare function architectureOverview(handbook: Handbook, config: HandbookConfig): string;
/** Architecture Decisions — links to ADR specs (content is included in Specifications). */
export declare function architectureDecisions(handbook: Handbook): string;
/**
 * Steering Documents — a top-level section (placed before the Specifications)
 * reproducing every steering document in full. These are project-wide rules and
 * guidance, not an appendix.
 */
export declare function steeringSection(config: HandbookConfig): Promise<string>;
/** Appendices — consolidated reference-file listing. */
export declare function appendices(handbook: Handbook): string;
