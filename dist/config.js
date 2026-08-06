import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
const DEFAULTS = {
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
    git: { history_limit: 200, release_tag_glob: 'v*' },
    build_date: undefined,
};
/** Locate the tool package root (contains this compiled/loaded module + templates). */
export function findToolRoot() {
    // src/config.ts -> src -> package root
    const here = dirname(fileURLToPath(import.meta.url));
    return resolve(here, '..');
}
/**
 * Walk up from `start` until a repository root is found. A repo root is a
 * directory that contains a `.kiro` folder (the spec source of truth).
 */
export function findRepoRoot(start = process.cwd()) {
    let dir = resolve(start);
    for (;;) {
        if (existsSync(join(dir, '.kiro')))
            return dir;
        const parent = dirname(dir);
        if (parent === dir)
            break;
        dir = parent;
    }
    // Fall back to cwd; downstream code surfaces a clear error if specs are missing.
    return resolve(start);
}
function deepMerge(base, override) {
    if (override === null || override === undefined)
        return base;
    if (typeof base !== 'object' || Array.isArray(base))
        return override ?? base;
    const out = { ...base };
    const src = override;
    for (const key of Object.keys(src)) {
        if (src[key] === undefined)
            continue;
        const baseVal = base[key];
        out[key] =
            baseVal && typeof baseVal === 'object' && !Array.isArray(baseVal)
                ? deepMerge(baseVal, src[key])
                : src[key];
    }
    return out;
}
/**
 * Load and normalise the handbook configuration. Missing files fall back to
 * built-in defaults so the tool still runs on a fresh checkout.
 */
export function loadConfig(options = {}) {
    const repoRoot = options.repoRoot ?? findRepoRoot();
    const toolRoot = findToolRoot();
    const configPath = options.configPath ?? join(repoRoot, '.kiro', 'handbook.yml');
    let raw = {};
    if (existsSync(configPath)) {
        const parsed = yaml.load(readFileSync(configPath, 'utf8'));
        raw = parsed ?? {};
    }
    const merged = deepMerge(DEFAULTS, raw);
    return { ...merged, repoRoot, toolRoot };
}
/** Resolve a config path (which may be relative to the repo root) to an absolute path. */
export function resolveFromRepo(config, p) {
    return isAbsolute(p) ? p : join(config.repoRoot, p);
}
/** Resolve a path relative to the tool package (e.g. the LaTeX template). */
export function resolveFromTool(config, p) {
    return isAbsolute(p) ? p : join(config.toolRoot, p);
}
//# sourceMappingURL=config.js.map