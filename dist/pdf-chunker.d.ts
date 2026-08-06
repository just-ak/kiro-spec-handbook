/**
 * PDF Chunker - Split large PDFs into smaller, VALID PDF chunks for Kiro's 4MB
 * attachment limit.
 *
 * Splitting is PAGE-BASED: pages are packed into a chunk until adding the next
 * page would exceed the target size, at which point a new chunk is started.
 * Every chunk is a fully valid, standalone PDF (correct header, objects, xref
 * table, and trailer) that opens on its own.
 *
 * Usage:
 *   npx handbook chunk --input handbook.pdf --size 3
 *
 * Outputs chunks like:
 *   handbook_chunk_1_of_3.pdf
 *   handbook_chunk_2_of_3.pdf
 *   handbook_chunk_3_of_3.pdf
 */
export interface ChunkOptions {
    inputPath: string;
    outputDir: string;
    chunkSizeMB: 1 | 2 | 3 | 4;
    dryRun?: boolean;
}
export interface ChunkResult {
    totalSize: number;
    totalSizeMB: number;
    chunkSizeMB: number;
    chunksCreated: number;
    chunks: Array<{
        index: number;
        path: string;
        sizeBytes: number;
        sizeMB: string;
        pages: number;
    }>;
}
/**
 * Split a PDF into valid, page-based chunks that each stay at or under the
 * target size where possible. A single page larger than the target size is
 * emitted as its own (oversized) chunk with a warning — it cannot be split
 * further without rasterising.
 */
export declare function chunkPdf(options: ChunkOptions): Promise<ChunkResult>;
/**
 * Suggest a chunk size (1-4 MB) based on PDF size. Prefers the largest chunk
 * size (fewest chunks) while keeping each chunk within Kiro's 4MB limit.
 */
export declare function suggestChunkSize(pdfSizeBytes: number): 1 | 2 | 3 | 4;
/** Validate that a chunk size is one of the supported values. */
export declare function isValidChunkSize(size: unknown): size is 1 | 2 | 3 | 4;
