import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, readdirSync, readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { PDFDocument } from 'pdf-lib';
import { chunkPdf, isValidChunkSize, suggestChunkSize } from '../src/pdf-chunker.js';

/**
 * Build a real, valid multi-page PDF for testing. Each page is padded with
 * random (incompressible) base64 text so the serialised file has meaningful
 * size — repeated characters would flate-compress away and defeat the point.
 * This lets us exercise the page-packing logic against real chunk-size targets.
 */
async function makeTestPdf(pages: number, padBytesPerPage = 0): Promise<Buffer> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) {
    const page = doc.addPage([612, 792]);
    page.drawText(`Page ${i + 1}`, { x: 50, y: 700, size: 24 });
    if (padBytesPerPage > 0) {
      // Random base64 (WinAnsi-safe) resists compression, inflating page size.
      const filler = randomBytes(Math.ceil(padBytesPerPage * 0.75)).toString('base64');
      // Split across several draw calls to avoid one absurdly long line.
      const lineLen = 2000;
      for (let off = 0, y = 680; off < filler.length && y > 20; off += lineLen, y -= 2) {
        page.drawText(filler.slice(off, off + lineLen), { x: 5, y, size: 1 });
      }
    }
  }
  const bytes = await doc.save();
  return Buffer.from(bytes);
}

/** Assert that a file on disk is a parseable PDF with the given page count. */
async function assertValidPdf(path: string): Promise<number> {
  const buf = readFileSync(path);
  expect(buf.slice(0, 5).toString()).toBe('%PDF-');
  const doc = await PDFDocument.load(buf);
  return doc.getPageCount();
}

describe('PDF Chunker', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `pdf-chunker-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  describe('isValidChunkSize', () => {
    it('accepts valid chunk sizes', () => {
      expect(isValidChunkSize(1)).toBe(true);
      expect(isValidChunkSize(2)).toBe(true);
      expect(isValidChunkSize(3)).toBe(true);
      expect(isValidChunkSize(4)).toBe(true);
    });

    it('rejects invalid chunk sizes', () => {
      expect(isValidChunkSize(0)).toBe(false);
      expect(isValidChunkSize(5)).toBe(false);
      expect(isValidChunkSize(-1)).toBe(false);
      expect(isValidChunkSize('4')).toBe(false);
      expect(isValidChunkSize(null)).toBe(false);
    });
  });

  describe('suggestChunkSize', () => {
    it('always suggests 4MB to minimise chunk count within Kiro limit', () => {
      expect(suggestChunkSize(1024 * 1024 * 2)).toBe(4);
      expect(suggestChunkSize(1024 * 1024 * 10)).toBe(4);
      expect(suggestChunkSize(1024 * 1024 * 50)).toBe(4);
    });
  });

  describe('chunkPdf', () => {
    it('creates a single chunk for a small PDF', async () => {
      const pdfPath = join(tmpDir, 'small.pdf');
      writeFileSync(pdfPath, await makeTestPdf(3));

      const result = await chunkPdf({
        inputPath: pdfPath,
        outputDir: tmpDir,
        chunkSizeMB: 4,
      });

      expect(result.chunksCreated).toBe(1);
      expect(result.chunks).toHaveLength(1);
      const pages = await assertValidPdf(result.chunks[0].path);
      expect(pages).toBe(3);
    });

    it('produces VALID PDF chunks (correct header + parseable)', async () => {
      // ~1MB per page filler, 6 pages, target 2MB → multiple chunks
      const pdfPath = join(tmpDir, 'valid.pdf');
      writeFileSync(pdfPath, await makeTestPdf(6, 400_000));

      const result = await chunkPdf({
        inputPath: pdfPath,
        outputDir: tmpDir,
        chunkSizeMB: 1,
      });

      expect(result.chunksCreated).toBeGreaterThan(1);
      // Every chunk must be a valid, openable PDF.
      let totalPages = 0;
      for (const chunk of result.chunks) {
        const pages = await assertValidPdf(chunk.path);
        expect(pages).toBeGreaterThan(0);
        totalPages += pages;
      }
      // All pages preserved across chunks.
      expect(totalPages).toBe(6);
    });

    it('names chunk files sequentially with total count', async () => {
      const pdfPath = join(tmpDir, 'test.pdf');
      writeFileSync(pdfPath, await makeTestPdf(8, 400_000));

      const result = await chunkPdf({
        inputPath: pdfPath,
        outputDir: tmpDir,
        chunkSizeMB: 1,
      });

      const n = result.chunksCreated;
      const files = readdirSync(tmpDir);
      for (let i = 1; i <= n; i++) {
        expect(files).toContain(`test_chunk_${i}_of_${n}.pdf`);
      }
    });

    it('does not write files in dry-run mode', async () => {
      const pdfPath = join(tmpDir, 'dryrun.pdf');
      writeFileSync(pdfPath, await makeTestPdf(6, 400_000));

      const result = await chunkPdf({
        inputPath: pdfPath,
        outputDir: tmpDir,
        chunkSizeMB: 1,
        dryRun: true,
      });

      expect(result.chunksCreated).toBeGreaterThan(0);
      const files = readdirSync(tmpDir).filter((f) => f.endsWith('.pdf'));
      expect(files).toEqual(['dryrun.pdf']);
    });

    it('keeps each chunk at or under the target size (when pages allow)', async () => {
      const pdfPath = join(tmpDir, 'sizecap.pdf');
      writeFileSync(pdfPath, await makeTestPdf(10, 300_000));

      const result = await chunkPdf({
        inputPath: pdfPath,
        outputDir: tmpDir,
        chunkSizeMB: 1,
      });

      for (const chunk of result.chunks) {
        // Allow a small tolerance for PDF structural overhead on multi-page chunks.
        expect(chunk.sizeBytes).toBeLessThanOrEqual(1024 * 1024 + 200_000);
      }
    });

    it('preserves all pages across chunks', async () => {
      const pdfPath = join(tmpDir, 'pages.pdf');
      writeFileSync(pdfPath, await makeTestPdf(12, 300_000));

      const result = await chunkPdf({
        inputPath: pdfPath,
        outputDir: tmpDir,
        chunkSizeMB: 1,
      });

      const totalPages = result.chunks.reduce((sum, c) => sum + c.pages, 0);
      expect(totalPages).toBe(12);
    });

    it('throws for a non-existent file', async () => {
      await expect(
        chunkPdf({
          inputPath: '/nonexistent/file.pdf',
          outputDir: tmpDir,
          chunkSizeMB: 3,
        }),
      ).rejects.toThrow('Failed to read PDF');
    });

    it('throws for a file that is not a valid PDF', async () => {
      const badPath = join(tmpDir, 'not-a-pdf.pdf');
      writeFileSync(badPath, Buffer.from('this is not a pdf'));

      await expect(
        chunkPdf({
          inputPath: badPath,
          outputDir: tmpDir,
          chunkSizeMB: 3,
        }),
      ).rejects.toThrow('Failed to parse PDF');
    });

    it('preserves chunk order and naming metadata', async () => {
      const pdfPath = join(tmpDir, 'ordered.pdf');
      writeFileSync(pdfPath, await makeTestPdf(9, 400_000));

      const result = await chunkPdf({
        inputPath: pdfPath,
        outputDir: tmpDir,
        chunkSizeMB: 1,
      });

      for (let i = 0; i < result.chunks.length; i++) {
        const chunk = result.chunks[i];
        expect(chunk.index).toBe(i + 1);
        expect(chunk.path).toContain(`_chunk_${i + 1}_of_${result.chunksCreated}.pdf`);
      }
    });
  });
});
