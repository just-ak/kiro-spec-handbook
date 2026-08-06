import type { HandbookConfig } from './types.js';
export interface CommitInfo {
    hash: string;
    shortHash: string;
    date: string;
    author: string;
    subject: string;
    /** Spec ids mentioned in the commit subject (e.g. SPEC-STATEMENTS). */
    specIds: string[];
}
export interface ReleaseTag {
    name: string;
    date: string;
}
/** Whether the repo root is inside a git work tree. */
export declare function isGitRepo(repoRoot: string): Promise<boolean>;
/** Short revision hash the handbook is built from, if available. */
export declare function currentRevision(repoRoot: string): Promise<string | undefined>;
/** ISO date of the most recent commit (deterministic per commit). */
export declare function lastCommitDate(repoRoot: string): Promise<string | undefined>;
/**
 * Read commit history. When `pathspec` is provided, only commits touching that
 * path are returned. `limit` of 0 means "all".
 */
export declare function commitHistory(config: HandbookConfig, options?: {
    limit?: number;
    pathspec?: string;
}): Promise<CommitInfo[]>;
/**
 * List spec slugs that changed between `ref` and the working tree (or HEAD).
 * Returns the set of changed relative paths under the specs source root.
 */
export declare function changedSpecPaths(config: HandbookConfig, ref: string): Promise<string[]>;
/** Release tags matching the configured glob, with their tag/commit dates. */
export declare function releaseTags(config: HandbookConfig): Promise<ReleaseTag[]>;
