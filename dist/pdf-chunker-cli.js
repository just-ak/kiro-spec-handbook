#!/usr/bin/env node
/**
 * Standalone PDF Chunker CLI
 *
 * Usage:
 *   npx pdf-chunker [options]
 *
 * Examples:
 *   npx pdf-chunker handbook.pdf                    # Auto-detect optimal size
 *   npx pdf-chunker handbook.pdf --size 3           # Use 3MB chunks
 *   npx pdf-chunker handbook.pdf --size 4 --output ./chunks
 *   npx pdf-chunker handbook.pdf --dry-run          # Preview without creating files
 */
import { statSync } from 'node:fs';
import { dirname } from 'node:path';
import { chunkPdf, isValidChunkSize, suggestChunkSize } from './pdf-chunker.js';
import { logger } from './logger.js';
function printUsage() {
    process.stdout.write(`
PDF Chunker — Split large PDFs into smaller chunks for Kiro upload

Usage:
  pdf-chunker <input-file> [options]

Options:
  --size <mb>, -s <mb>    Chunk size in MB: 1, 2, 3, or 4 (default: auto-detect)
  --output <dir>, -o <dir>  Output directory (default: same as input)
  --dry-run               Show what would be created without writing files
  --help, -h              Show this help message

Examples:
  pdf-chunker handbook.pdf                    # Auto-detect optimal size
  pdf-chunker handbook.pdf --size 3           # Use 3MB chunks
  pdf-chunker handbook.pdf --size 4 -o ./chunks
  pdf-chunker handbook.pdf --dry-run          # Preview without creating files

Max chunk sizes are limited to 4MB to fit Kiro's attachment limits.

`);
}
function parseArgs() {
    const args = process.argv.slice(2);
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        printUsage();
        process.exit(0);
    }
    const options = {
        input: '',
        dryRun: false,
        autoSize: true,
    };
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--size' || arg === '-s') {
            options.size = parseInt(args[++i], 10);
            options.autoSize = false;
        }
        else if (arg === '--output' || arg === '-o') {
            options.output = args[++i];
        }
        else if (arg === '--dry-run') {
            options.dryRun = true;
        }
        else if (!arg.startsWith('-')) {
            options.input = arg;
        }
    }
    if (!options.input) {
        logger.error('No input file specified.');
        printUsage();
        process.exit(1);
    }
    return options;
}
async function main() {
    const opts = parseArgs();
    try {
        let chunkSize = 3;
        if (opts.autoSize) {
            try {
                const stat = statSync(opts.input);
                chunkSize = suggestChunkSize(stat.size);
                logger.info(`Auto-detected optimal chunk size: ${chunkSize}MB`);
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                logger.error(`Failed to read file: ${msg}`);
                process.exit(1);
            }
        }
        else if (opts.size !== undefined) {
            if (!isValidChunkSize(opts.size)) {
                logger.error(`Invalid chunk size: ${opts.size}. Must be one of: 1, 2, 3, or 4 (MB)`);
                process.exit(1);
            }
            chunkSize = opts.size;
        }
        const result = await chunkPdf({
            inputPath: opts.input,
            outputDir: opts.output || dirname(opts.input),
            chunkSizeMB: chunkSize,
            dryRun: opts.dryRun,
        });
        logger.info('');
        logger.info(`Summary:`);
        logger.info(`  Total PDF size:  ${result.totalSizeMB.toFixed(2)} MB`);
        logger.info(`  Chunk size:      ${result.chunkSizeMB} MB`);
        logger.info(`  Chunks created:  ${result.chunksCreated}`);
        logger.info('');
        logger.info(`Chunks:`);
        for (const chunk of result.chunks) {
            logger.info(`  [${chunk.index}/${result.chunksCreated}] ${chunk.path} (${chunk.sizeMB} MB, ${chunk.pages} pages)`);
        }
        logger.info('');
        logger.info(`Upload these chunks to Kiro in order. Each is a valid, standalone PDF.`);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error(`Failed to chunk PDF: ${msg}`);
        process.exit(1);
    }
}
main().catch((err) => {
    logger.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
});
//# sourceMappingURL=pdf-chunker-cli.js.map