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
export {};
