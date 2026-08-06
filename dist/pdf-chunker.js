import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, parse } from 'node:path';
import { PDFDocument } from 'pdf-lib';
import { logger } from './logger.js';
const MB = 1024 * 1024;
/** Build a single-page PDF and return its serialised byte length. */
async function pageByteSize(source, pageIndex) {
    const doc = await PDFDocument.create();
    const [copied] = await doc.copyPages(source, [pageIndex]);
    doc.addPage(copied);
    const bytes = await doc.save();
    return bytes.length;
}
/** Serialise a chunk document to a buffer, writing it unless dryRun. */
async function saveChunk(pageIndices, source) {
    const doc = await PDFDocument.create();
    const copied = await doc.copyPages(source, pageIndices);
    for (const page of copied)
        doc.addPage(page);
    return doc.save();
}
/**
 * Split a PDF into valid, page-based chunks that each stay at or under the
 * target size where possible. A single page larger than the target size is
 * emitted as its own (oversized) chunk with a warning — it cannot be split
 * further without rasterising.
 */
export async function chunkPdf(options) {
    const { inputPath, outputDir, chunkSizeMB, dryRun = false } = options;
    let inputBuffer;
    try {
        inputBuffer = readFileSync(inputPath);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to read PDF: ${msg}`);
    }
    const totalSizeBytes = inputBuffer.length;
    const totalSizeMB = totalSizeBytes / MB;
    const targetBytes = chunkSizeMB * MB;
    let source;
    try {
        source = await PDFDocument.load(inputBuffer, { ignoreEncryption: true });
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to parse PDF (is it a valid PDF file?): ${msg}`);
    }
    const pageCount = source.getPageCount();
    logger.info(`PDF size: ${totalSizeMB.toFixed(2)} MB (${pageCount} pages)`);
    logger.info(`Chunk size target: ${chunkSizeMB} MB`);
    const { name } = parse(inputPath);
    // If the whole PDF already fits, emit a single re-saved chunk.
    if (totalSizeBytes <= targetBytes) {
        logger.info(`PDF fits within a single ${chunkSizeMB}MB chunk.`);
        const chunkPath = join(outputDir, `${name}_chunk_1_of_1.pdf`);
        if (!dryRun) {
            mkdirSync(outputDir, { recursive: true });
            writeFileSync(chunkPath, inputBuffer);
            logger.success(`Created: ${chunkPath}`);
        }
        return {
            totalSize: totalSizeBytes,
            totalSizeMB,
            chunkSizeMB,
            chunksCreated: 1,
            chunks: [
                {
                    index: 1,
                    path: chunkPath,
                    sizeBytes: totalSizeBytes,
                    sizeMB: totalSizeMB.toFixed(2),
                    pages: pageCount,
                },
            ],
        };
    }
    // Greedily group pages into chunks that stay within the target size.
    // We estimate each chunk's size incrementally; because copied objects can be
    // shared (fonts/images), the single-page estimate is an upper bound, so we
    // verify the real serialised size after building each chunk and back off a
    // page if it overshoots.
    const groups = [];
    let current = [];
    for (let i = 0; i < pageCount; i++) {
        const pageSize = await pageByteSize(source, i);
        if (pageSize > targetBytes && current.length === 0) {
            // A single page exceeds the target on its own — emit it alone.
            logger.warn(`Page ${i + 1} is ${(pageSize / MB).toFixed(2)}MB, larger than the ${chunkSizeMB}MB target. It will be its own (oversized) chunk.`);
            groups.push([i]);
            current = [];
            continue;
        }
        const tentative = [...current, i];
        const tentativeBytes = (await saveChunk(tentative, source)).length;
        if (tentativeBytes > targetBytes && current.length > 0) {
            // Adding this page overshoots; close the current group and start fresh.
            groups.push(current);
            current = [i];
        }
        else {
            current = tentative;
        }
    }
    if (current.length > 0)
        groups.push(current);
    const numChunks = groups.length;
    logger.info(`Will create ${numChunks} valid PDF chunks.`);
    if (!dryRun)
        mkdirSync(outputDir, { recursive: true });
    const chunks = [];
    for (let g = 0; g < groups.length; g++) {
        const indices = groups[g];
        const bytes = await saveChunk(indices, source);
        const chunkFileName = `${name}_chunk_${g + 1}_of_${numChunks}.pdf`;
        const chunkPath = join(outputDir, chunkFileName);
        const sizeMB = bytes.length / MB;
        if (!dryRun) {
            writeFileSync(chunkPath, bytes);
            logger.success(`Created chunk ${g + 1}/${numChunks}: ${chunkFileName} (${sizeMB.toFixed(2)} MB, ${indices.length} pages)`);
        }
        else {
            logger.info(`[DRY RUN] Would create chunk ${g + 1}/${numChunks}: ${chunkFileName} (${sizeMB.toFixed(2)} MB, ${indices.length} pages)`);
        }
        chunks.push({
            index: g + 1,
            path: chunkPath,
            sizeBytes: bytes.length,
            sizeMB: sizeMB.toFixed(2),
            pages: indices.length,
        });
    }
    logger.success(`PDF chunking complete: ${numChunks} valid chunks created.`);
    return {
        totalSize: totalSizeBytes,
        totalSizeMB,
        chunkSizeMB,
        chunksCreated: numChunks,
        chunks,
    };
}
/**
 * Suggest a chunk size (1-4 MB) based on PDF size. Prefers the largest chunk
 * size (fewest chunks) while keeping each chunk within Kiro's 4MB limit.
 */
export function suggestChunkSize(pdfSizeBytes) {
    // Always prefer 4MB chunks — they minimise the number of uploads while
    // remaining within Kiro's per-attachment limit. Smaller sizes are opt-in.
    const pdfSizeMB = pdfSizeBytes / MB;
    if (pdfSizeMB <= 4)
        return 4;
    return 4;
}
/** Validate that a chunk size is one of the supported values. */
export function isValidChunkSize(size) {
    return size === 1 || size === 2 || size === 3 || size === 4;
}
//# sourceMappingURL=pdf-chunker.js.map