import type { Handbook, HandbookConfig } from './types.js';
/** Markdown fragments produced by the indexer/changelog, injected in order. */
export interface HandbookParts {
    documentInfo: string;
    revisionHistory: string;
    architectureOverview: string;
    specIndex: string;
    requirementsIndex: string;
    tasksIndex: string;
    diagramIndex: string;
    steering: string;
    architectureDecisions: string;
    traceability: string;
    gitHistory: string;
    appendices: string;
}
export interface RenderResult {
    markdownPath: string;
    pdfPath: string | null;
    pandocAvailable: boolean;
}
/** Shift every ATX heading in `content` down by `by` levels (capped at h6). */
export declare function shiftHeadings(content: string, by: number): string;
interface DiagramImage {
    markdownPath: string;
    converted: boolean;
}
/**
 * Assemble the complete handbook markdown in the prescribed order.
 * This is pure (no IO) so it can be unit-tested.
 */
export declare function assembleMarkdown(handbook: Handbook, config: HandbookConfig, parts: HandbookParts, images: Map<string, DiagramImage | null>, mermaidImages?: Map<string, DiagramImage | null>): string;
/**
 * Full render pipeline: prepare diagrams, assemble markdown, write it, and invoke
 * pandoc when available. Returns paths and whether a PDF was produced.
 */
export declare function render(handbook: Handbook, config: HandbookConfig, parts: HandbookParts): Promise<RenderResult>;
export {};
