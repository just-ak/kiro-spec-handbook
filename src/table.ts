/**
 * Shared helpers for building Pandoc pipe-tables that render cleanly in LaTeX.
 *
 * These are used by both the indexes and the appendix tables so every wide table
 * behaves consistently: pipes are escaped, column widths are explicit, and wide
 * rows are placed on a compact landscape page.
 */

/** Escape pipe characters and strip newlines so table cells never break a row. */
export function cell(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
}

/**
 * Build a pipe-table delimiter row that encodes relative column widths via dash
 * counts. Pandoc turns these into explicit fractional widths, so the table spans
 * the full page width and each column is sized deliberately (no wasted space).
 */
export function delimiter(cols: Array<{ w: number; align?: 'l' | 'r' | 'c' }>): string {
  const cells = cols.map(({ w, align = 'l' }) => {
    const dashes = '-'.repeat(Math.max(3, w));
    if (align === 'r') return `${dashes}:`;
    if (align === 'c') return `:${dashes}:`;
    return `:${dashes}`;
  });
  return `| ${cells.join(' | ')} |`;
}

/**
 * Wrap a table in a landscape page at a compact 8pt so wide rows (long spec /
 * requirement / task IDs) fit on a single line. The raw-LaTeX command wrappers
 * are defined in the template and ignored by non-LaTeX writers, which still
 * parse the markdown table between them.
 *
 * The section `heading` (markdown, e.g. `# Specification Index`) is placed
 * *inside* the landscape block, at normal size, so it stays on the same
 * landscape page as its table. Emitting it before `\blandscape` would strand it
 * on the preceding portrait page, because entering landscape starts a new page.
 */
export function landscapeCompact(tableLines: string[], heading?: string): string[] {
  return [
    '\\blandscape',
    ...(heading ? ['', heading, ''] : []),
    '\\begingroup\\fontsize{8pt}{10pt}\\selectfont',
    '',
    ...tableLines,
    '',
    '\\endgroup',
    '\\elandscape',
    '',
  ];
}

/**
 * Portrait-oriented compact table: keeps the section heading on the same page as
 * its table (no landscape rotation, so the normal running header/footer are
 * retained) and renders the table at 8pt so wide rows still fit within the
 * narrower portrait text block. Column widths from `delimiter()` are relative,
 * so long ids sit in their own column rather than colliding.
 */
export function portraitCompact(tableLines: string[], heading: string): string[] {
  return [
    heading,
    '',
    '\\begingroup\\fontsize{8pt}{10pt}\\selectfont',
    '',
    ...tableLines,
    '',
    '\\endgroup',
    '',
  ];
}
