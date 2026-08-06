import type { Handbook, HandbookConfig } from './types.js';
/**
 * Revision history table built from release tags. Falls back to a single
 * "current build" row when the repo has no matching tags.
 */
export declare function revisionHistory(config: HandbookConfig, handbook: Handbook): Promise<string>;
/**
 * Git change-history appendix. Groups recent commits and links any spec ids
 * mentioned in commit subjects back to their handbook sections.
 */
export declare function gitChangeHistory(config: HandbookConfig, handbook: Handbook): Promise<string>;
