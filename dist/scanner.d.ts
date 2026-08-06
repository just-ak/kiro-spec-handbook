import type { HandbookConfig, Spec } from './types.js';
/**
 * Discover and parse every spec under `config.source.specs`.
 * Returns specs sorted by their stable id for deterministic output.
 */
export declare function scanSpecs(config: HandbookConfig): Promise<Spec[]>;
