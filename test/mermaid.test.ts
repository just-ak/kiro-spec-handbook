import { describe, expect, it } from 'vitest';
import { extractMermaidBlocks, replaceMermaidBlocks, sanitizeMermaid } from '../src/mermaid.js';

describe('mermaid extraction', () => {
  it('extracts fenced mermaid blocks in order', () => {
    const md = ['# H', '', '```mermaid', 'graph TD', 'A-->B', '```', '', 'text', '', '```mermaid', 'sequenceDiagram', '```'].join('\n');
    const blocks = extractMermaidBlocks(md);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].code).toContain('graph TD');
    expect(blocks[1].code).toContain('sequenceDiagram');
  });

  it('replaces blocks by index, preserving surrounding text', () => {
    const md = 'before\n```mermaid\ngraph TD\n```\nafter';
    const out = replaceMermaidBlocks(md, (b) => `[img ${b.index}]`);
    expect(out).toBe('before\n[img 0]\nafter');
  });
});

describe('mermaid sanitiser', () => {
  it('quotes subgraph titles with parentheses', () => {
    const code = 'graph TD\n  subgraph Reporting (read-only consumers)\n  end';
    expect(sanitizeMermaid(code)).toContain('subgraph "Reporting (read-only consumers)"');
  });

  it('replaces semicolons in sequence message text with commas', () => {
    const code = 'sequenceDiagram\n  L->>L: compute amount; assign id, ownerId';
    const out = sanitizeMermaid(code);
    expect(out).toContain('L->>L: compute amount, assign id, ownerId');
    expect(out).not.toContain(';');
  });

  it('leaves already-valid diagrams unchanged', () => {
    const code = 'graph TD\n  A-->B\n  B-->C';
    expect(sanitizeMermaid(code)).toBe(code);
  });
});
