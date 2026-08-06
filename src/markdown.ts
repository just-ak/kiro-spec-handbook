import { requirementId, taskId } from './metadata.js';
import type { RequirementRef, TaskRef } from './types.js';

/** Extract the first level-1 heading (used as a fallback spec title). */
export function extractH1(content: string): string | undefined {
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const m = /^#\s+(.+?)\s*$/.exec(line);
    if (m) return m[1].replace(/[`*_]/g, '').trim();
  }
  return undefined;
}

const REQUIREMENT_HEADING = /^#{2,4}\s+Requirement\s+(\d+)\s*:\s*(.+?)\s*$/;

/** Parse `### Requirement N: Title` headings from a requirements document. */
export function parseRequirements(specId: string, content: string): RequirementRef[] {
  const out: RequirementRef[] = [];
  const seen = new Set<number>();
  for (const line of content.split(/\r?\n/)) {
    const m = REQUIREMENT_HEADING.exec(line);
    if (!m) continue;
    const number = Number.parseInt(m[1], 10);
    if (seen.has(number)) continue;
    seen.add(number);
    out.push({
      id: requirementId(specId, number),
      specId,
      number,
      title: m[2].replace(/[`*_]/g, '').trim(),
    });
  }
  out.sort((a, b) => a.number - b.number);
  return out;
}

// Matches: "- [x] 1. Title", "  - [ ] 4.1 Title", "  - [x]\* 1.2 Title"
const TASK_LINE = /^\s*-\s*\[( |x|X)\]\\?\*?\s*(\d+(?:\.\d+)*)[.)]?\s+(.+?)\s*$/;
const REQUIREMENTS_REF = /_Requirements:\s*([^_]+)_/i;

/**
 * Parse checkbox tasks from a tasks document, associating each with any
 * `_Requirements: a.b, c.d_` references that appear in the following lines
 * (before the next task line).
 */
export function parseTasks(specId: string, content: string): TaskRef[] {
  const lines = content.split(/\r?\n/);
  const out: TaskRef[] = [];

  for (let i = 0; i < lines.length; i++) {
    const m = TASK_LINE.exec(lines[i]);
    if (!m) continue;

    const done = m[1].toLowerCase() === 'x';
    const number = m[2];
    const title = m[3].replace(/[`*]/g, '').trim();

    // Scan forward for a `_Requirements:` block until the next task line.
    const requirementNumbers: string[] = [];
    for (let j = i + 1; j < lines.length; j++) {
      if (TASK_LINE.test(lines[j])) break;
      const rm = REQUIREMENTS_REF.exec(lines[j]);
      if (rm) {
        for (const part of rm[1].split(',')) {
          const cleaned = part.trim();
          if (cleaned) requirementNumbers.push(cleaned);
        }
      }
    }

    out.push({
      id: taskId(specId, number),
      specId,
      number,
      title,
      done,
      requirementNumbers,
    });
  }

  return out;
}

/** Human-readable caption derived from an SVG file name. */
export function captionFromFileName(fileName: string): string {
  return fileName
    .replace(/\.svg$/i, '')
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
