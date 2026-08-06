/**
 * Shared domain types for the Specification Handbook Publisher.
 *
 * Everything the handbook renders is derived from Kiro specs on disk. These types
 * describe the intermediate model produced by scanning + parsing, before it is
 * assembled into Markdown and rendered to PDF via Pandoc.
 */
/** Lifecycle status declared in spec front matter (free-form, normalised lowercase). */
export type SpecStatus = string;
/** Front matter recognised on any spec markdown file. */
export interface SpecFrontMatter {
    spec_id?: string;
    title?: string;
    version?: string | number;
    status?: SpecStatus;
    [key: string]: unknown;
}
/** A single markdown document within a spec (requirements/design/tasks/reference). */
export interface SpecDocument {
    /** Logical kind of the document. */
    kind: 'requirements' | 'design' | 'tasks' | 'reference' | 'other';
    /** Absolute path on disk. */
    absPath: string;
    /** Path relative to the repository root (stable, POSIX separators). */
    relPath: string;
    /** Raw markdown content with front matter stripped. */
    content: string;
    /** Parsed front matter (may be empty). */
    frontMatter: SpecFrontMatter;
}
/** A requirement extracted from a requirements.md document. */
export interface RequirementRef {
    /** Stable requirement id, e.g. `SPEC-STATEMENTS:R3`. */
    id: string;
    /** Owning spec id. */
    specId: string;
    /** Requirement number as written in the doc (e.g. 3). */
    number: number;
    /** Human title after the colon. */
    title: string;
}
/** A task extracted from a tasks.md document. */
export interface TaskRef {
    /** Stable task id, e.g. `SPEC-STATEMENTS:T4.1`. */
    id: string;
    specId: string;
    /** Dotted task number as written (e.g. "4.1"). */
    number: string;
    title: string;
    /** true when the checkbox is ticked. */
    done: boolean;
    /** Requirement numbers this task references via `_Requirements: ..._`. */
    requirementNumbers: string[];
}
/** An SVG diagram belonging to a spec. */
export interface DiagramRef {
    /** Stable diagram id, e.g. `FIG-STATEMENTS-1`. */
    id: string;
    specId: string;
    /** Sequential figure number across the whole handbook (assigned at index time). */
    figureNumber?: number;
    /** Caption derived from the file name. */
    caption: string;
    absPath: string;
    relPath: string;
}
/** A supporting reference file (references/**). */
export interface ReferenceFileRef {
    specId: string;
    absPath: string;
    relPath: string;
    title: string;
}
/** A fully parsed specification (one directory under .kiro/specs). */
export interface Spec {
    /** Stable, filename/page-independent identifier. */
    id: string;
    /** Directory slug (the folder name under .kiro/specs). */
    slug: string;
    title: string;
    version: string;
    status: SpecStatus;
    /** Absolute path to the spec directory. */
    dir: string;
    documents: SpecDocument[];
    requirements: RequirementRef[];
    tasks: TaskRef[];
    diagrams: DiagramRef[];
    references: ReferenceFileRef[];
    /** Deterministic content hash across all source files in the spec. */
    contentHash: string;
}
/** The complete parsed model handed to the indexer/renderer. */
export interface Handbook {
    specs: Spec[];
    /** ISO build date (deterministic — derived from git or config). */
    buildDate: string;
    /** Short git revision the handbook was built from, if available. */
    revision?: string;
}
/** A single row of the handbook.lock.json manifest. */
export interface LockEntry {
    spec_id: string;
    title: string;
    content_hash: string;
    last_published: string;
    last_page: number;
}
export interface LockFile {
    version: 1;
    generated: string;
    entries: LockEntry[];
}
/** Loaded + normalised handbook.yml configuration. */
export interface HandbookConfig {
    title: string;
    subtitle: string;
    organisation: string;
    source: {
        specs: string;
        steering?: string;
    };
    output: {
        directory: string;
        filename: string;
    };
    pdf: {
        paper: string;
        notes_pages: boolean;
        template: string;
        toc_depth: number;
        header_shows_spec_id: boolean;
    };
    indexes: {
        specs: boolean;
        requirements: boolean;
        tasks: boolean;
        diagrams: boolean;
        changes: boolean;
    };
    traceability: {
        enabled: boolean;
    };
    git: {
        history_limit: number;
        release_tag_glob: string;
    };
    build_date?: string;
    /** Absolute path to the repository root (injected at load time). */
    repoRoot: string;
    /** Absolute path to the tool package root (injected at load time). */
    toolRoot: string;
}
