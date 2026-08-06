/** A fenced ```mermaid code block found in a document, in document order. */
export interface MermaidBlock {
    /** The mermaid source (without the fence). */
    code: string;
    /** 0-based index of this block within its document. */
    index: number;
}
/** Extract mermaid code blocks from a document in order. */
export declare function extractMermaidBlocks(content: string): MermaidBlock[];
/**
 * Replace each mermaid fenced block with the result of `replacer(index)`.
 * Blocks are numbered in document order so callers can map to rendered images.
 */
export declare function replaceMermaidBlocks(content: string, replacer: (block: MermaidBlock) => string): string;
/**
 * Conservatively repair common, parser-hostile patterns in hand-authored mermaid
 * so it renders, without changing the specs on disk or the diagram's meaning:
 *
 *  - Sequence diagrams: a `;` inside message/note text is treated by mermaid as a
 *    statement terminator and breaks parsing. Replace `;` with `,` in text after
 *    the first `:` on message/note lines.
 *  - Flowcharts: a `subgraph` title containing `()`/`&` etc. must be quoted.
 *
 * Returns the (possibly unchanged) code.
 */
export declare function sanitizeMermaid(code: string): string;
/** Locate the mmdc binary (mermaid-cli). Returns null when unavailable. */
export declare function findMmdc(repoRoot: string): string | null;
/**
 * Render a single mermaid diagram to SVG using mmdc. Returns true on success.
 * A puppeteer config with `--no-sandbox` is written so it works in CI containers.
 */
export declare function renderMermaidToSvg(mmdc: string, code: string, workDir: string, svgDest: string, env: NodeJS.ProcessEnv): Promise<boolean>;
