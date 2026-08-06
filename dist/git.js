import { execa } from 'execa';
async function git(repoRoot, args) {
    try {
        const { stdout } = await execa('git', args, { cwd: repoRoot });
        return stdout;
    }
    catch {
        return null;
    }
}
/** Whether the repo root is inside a git work tree. */
export async function isGitRepo(repoRoot) {
    const out = await git(repoRoot, ['rev-parse', '--is-inside-work-tree']);
    return out?.trim() === 'true';
}
/** Short revision hash the handbook is built from, if available. */
export async function currentRevision(repoRoot) {
    const out = await git(repoRoot, ['rev-parse', '--short', 'HEAD']);
    return out?.trim() || undefined;
}
/** ISO date of the most recent commit (deterministic per commit). */
export async function lastCommitDate(repoRoot) {
    const out = await git(repoRoot, ['log', '-1', '--format=%cI']);
    return out?.trim() || undefined;
}
const SPEC_ID_IN_TEXT = /SPEC-[A-Z0-9][A-Z0-9-]*/g;
/**
 * Read commit history. When `pathspec` is provided, only commits touching that
 * path are returned. `limit` of 0 means "all".
 */
export async function commitHistory(config, options = {}) {
    const limit = options.limit ?? config.git.history_limit;
    const sep = '\u001f'; // unit separator between fields
    const rec = '\u001e'; // record separator between commits
    const format = ['%H', '%h', '%cI', '%an', '%s'].join(sep) + rec;
    const args = ['log', `--pretty=format:${format}`];
    if (limit && limit > 0)
        args.push(`-n${limit}`);
    if (options.pathspec)
        args.push('--', options.pathspec);
    const out = await git(config.repoRoot, args);
    if (!out)
        return [];
    return out
        .split(rec)
        .map((r) => r.trim())
        .filter(Boolean)
        .map((r) => {
        const [hash, shortHash, date, author, subject] = r.split(sep);
        const specIds = Array.from(new Set(subject.match(SPEC_ID_IN_TEXT) ?? []));
        return { hash, shortHash, date, author, subject, specIds };
    });
}
/**
 * List spec slugs that changed between `ref` and the working tree (or HEAD).
 * Returns the set of changed relative paths under the specs source root.
 */
export async function changedSpecPaths(config, ref) {
    const out = await git(config.repoRoot, ['diff', '--name-only', ref, '--', config.source.specs]);
    if (!out)
        return [];
    return out
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .sort();
}
/** Release tags matching the configured glob, with their tag/commit dates. */
export async function releaseTags(config) {
    const out = await git(config.repoRoot, [
        'for-each-ref',
        '--sort=creatordate',
        '--format=%(refname:short)\u001f%(creatordate:short)',
        `refs/tags/${config.git.release_tag_glob}`,
    ]);
    if (!out)
        return [];
    return out
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => {
        const [name, date] = l.split('\u001f');
        return { name, date };
    });
}
//# sourceMappingURL=git.js.map