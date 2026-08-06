import type { HandbookConfig } from './types.js';
/** Locate the tool package root (contains this compiled/loaded module + templates). */
export declare function findToolRoot(): string;
/**
 * Walk up from `start` until a repository root is found. A repo root is a
 * directory that contains a `.kiro` folder (the spec source of truth).
 */
export declare function findRepoRoot(start?: string): string;
export interface LoadConfigOptions {
    /** Explicit path to a handbook.yml; defaults to `<repoRoot>/.kiro/handbook.yml`. */
    configPath?: string;
    repoRoot?: string;
}
/**
 * Load and normalise the handbook configuration. Missing files fall back to
 * built-in defaults so the tool still runs on a fresh checkout.
 */
export declare function loadConfig(options?: LoadConfigOptions): HandbookConfig;
/** Resolve a config path (which may be relative to the repo root) to an absolute path. */
export declare function resolveFromRepo(config: HandbookConfig, p: string): string;
/** Resolve a path relative to the tool package (e.g. the LaTeX template). */
export declare function resolveFromTool(config: HandbookConfig, p: string): string;
