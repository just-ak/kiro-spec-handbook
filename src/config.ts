import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import type { HandbookConfig } from './types.js';

const DEFAULTS: Omit<HandbookConfig, 'repoRoot' | 'toolRoot'> = {
  title: 'Specification Handbook',
  subtitle: 'Kiro Specification Reference',
  organisation: '',
  source: { specs: '.kiro/specs', steering: '.kiro/steering' },
  output: { directory: 'docs/handbook', filename: 'handbook' },
  pdf: {
    paper: 'A4',
    notes_pages: true,
    template: 'templates/handbook.latex',
    toc_depth: 3,
    header_shows_spec_id: true,
  },
  indexes: { specs: true, requirements: true, tasks: true, diagrams: true, changes: true },
  traceability: { enabled: true },
  tokenizer: { enabled: true, models: ['opus-4.8', 'haiku', 'gpt-4o'] },
  git: { history_limit: 200, release_tag_glob: 'v*' },
  build_date: undefined,
};

/** Locate the tool package root (contains this compiled/loaded module + templates). */
export function findToolRoot(): string {
  // src/config.ts -> src -> package root
  const here = dirname(fileURLToPath(import.meta.url));
  return resolve(here, '..');
}

/**
 * Walk up from `start` until a repository root is found. A repo root is a
 * directory that contains a `.kiro` folder (the spec source of truth).
 */
export function findRepoRoot(start: string = process.cwd()): string {
  let dir = resolve(start);
  for (;;) {
    if (existsSync(join(dir, '.kiro'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // Fall back to cwd; downstream code surfaces a clear error if specs are missing.
  return resolve(start);
}

function deepMerge<T>(base: T, override: unknown): T {
  if (override === null || override === undefined) return base;
  if (typeof base !== 'object' || Array.isArray(base)) return (override as T) ?? base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  const src = override as Record<string, unknown>;
  for (const key of Object.keys(src)) {
    if (src[key] === undefined) continue;
    const baseVal = (base as Record<string, unknown>)[key];
    out[key] =
      baseVal && typeof baseVal === 'object' && !Array.isArray(baseVal)
        ? deepMerge(baseVal, src[key])
        : src[key];
  }
  return out as T;
}

export interface LoadConfigOptions {
  /** Explicit path to a handbook.yml; defaults to `<repoRoot>/.kiro/handbook.yml`. */
  configPath?: string;
  repoRoot?: string;
}

/**
 * Load and normalise the handbook configuration. Missing files fall back to
 * built-in defaults so the tool still runs on a fresh checkout.
 */
export function loadConfig(options: LoadConfigOptions = {}): HandbookConfig {
  const repoRoot = options.repoRoot ?? findRepoRoot();
  const toolRoot = findToolRoot();
  const configPath = options.configPath ?? join(repoRoot, '.kiro', 'handbook.yml');

  let raw: unknown = {};
  if (existsSync(configPath)) {
    const parsed = yaml.load(readFileSync(configPath, 'utf8'));
    raw = parsed ?? {};
  }

  const merged = deepMerge(DEFAULTS, raw);
  return { ...merged, repoRoot, toolRoot };
}

/** Resolve a config path (which may be relative to the repo root) to an absolute path. */
export function resolveFromRepo(config: HandbookConfig, p: string): string {
  return isAbsolute(p) ? p : join(config.repoRoot, p);
}

/** Resolve a path relative to the tool package (e.g. the LaTeX template). */
export function resolveFromTool(config: HandbookConfig, p: string): string {
  return isAbsolute(p) ? p : join(config.toolRoot, p);
}
