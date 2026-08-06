import type { Handbook, LockFile } from './types.js';
export interface LockDelta {
    added: string[];
    changed: string[];
    removed: string[];
    unchanged: string[];
}
/** Read an existing lock file, tolerating absence/corruption by returning null. */
export declare function readLock(lockPath: string): LockFile | null;
/**
 * Compare the current handbook against a previous lock to detect what changed
 * since the last publish. Used for delta printing on reMarkable.
 */
export declare function computeDelta(handbook: Handbook, previous: LockFile | null): LockDelta;
/**
 * Build the next lock file. Page numbers are preserved from the previous lock
 * where known (real page numbers are only available after PDF rendering and are
 * fed back via `pageBySpecId`).
 */
export declare function buildLock(handbook: Handbook, previous: LockFile | null, pageBySpecId?: Map<string, number>): LockFile;
/** Serialise the lock file deterministically (stable key order, trailing newline). */
export declare function serialiseLock(lock: LockFile): string;
