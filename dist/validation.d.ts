import type { Spec } from './types.js';
export interface ValidationIssue {
    level: 'error' | 'warning';
    specId: string;
    message: string;
}
export interface ValidationReport {
    issues: ValidationIssue[];
    errorCount: number;
    warningCount: number;
    ok: boolean;
}
/**
 * Validate the parsed specs for metadata completeness and internal consistency.
 *
 * Errors (block a build):
 *  - duplicate spec ids (breaks stable-id guarantee / cross references)
 *
 * Warnings (surfaced, non-blocking):
 *  - missing front matter fields (spec_id/title/version/status)
 *  - missing requirements/design/tasks documents
 *  - tasks referencing requirement numbers that do not exist
 *  - specs with no requirements
 */
export declare function validateSpecs(specs: Spec[]): ValidationReport;
