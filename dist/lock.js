import { existsSync, readFileSync } from 'node:fs';
/** Read an existing lock file, tolerating absence/corruption by returning null. */
export function readLock(lockPath) {
    if (!existsSync(lockPath))
        return null;
    try {
        const parsed = JSON.parse(readFileSync(lockPath, 'utf8'));
        if (parsed && parsed.version === 1 && Array.isArray(parsed.entries))
            return parsed;
        return null;
    }
    catch {
        return null;
    }
}
/**
 * Compare the current handbook against a previous lock to detect what changed
 * since the last publish. Used for delta printing on reMarkable.
 */
export function computeDelta(handbook, previous) {
    const prevById = new Map((previous?.entries ?? []).map((e) => [e.spec_id, e]));
    const currentIds = new Set(handbook.specs.map((s) => s.id));
    const added = [];
    const changed = [];
    const unchanged = [];
    for (const spec of handbook.specs) {
        const prev = prevById.get(spec.id);
        if (!prev) {
            added.push(spec.id);
        }
        else if (prev.content_hash !== spec.contentHash) {
            changed.push(spec.id);
        }
        else {
            unchanged.push(spec.id);
        }
    }
    const removed = [...prevById.keys()].filter((id) => !currentIds.has(id));
    added.sort();
    changed.sort();
    removed.sort();
    unchanged.sort();
    return { added, changed, removed, unchanged };
}
/**
 * Build the next lock file. Page numbers are preserved from the previous lock
 * where known (real page numbers are only available after PDF rendering and are
 * fed back via `pageBySpecId`).
 */
export function buildLock(handbook, previous, pageBySpecId = new Map()) {
    const prevById = new Map((previous?.entries ?? []).map((e) => [e.spec_id, e]));
    const entries = handbook.specs.map((spec) => {
        const prev = prevById.get(spec.id);
        const changed = !prev || prev.content_hash !== spec.contentHash;
        return {
            spec_id: spec.id,
            title: spec.title,
            content_hash: spec.contentHash,
            // last_published only advances when content actually changed.
            last_published: changed ? handbook.buildDate : (prev?.last_published ?? handbook.buildDate),
            last_page: pageBySpecId.get(spec.id) ?? prev?.last_page ?? 0,
        };
    });
    entries.sort((a, b) => a.spec_id.localeCompare(b.spec_id));
    return {
        version: 1,
        generated: handbook.buildDate,
        entries,
    };
}
/** Serialise the lock file deterministically (stable key order, trailing newline). */
export function serialiseLock(lock) {
    return JSON.stringify(lock, null, 2) + '\n';
}
//# sourceMappingURL=lock.js.map