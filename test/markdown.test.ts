import { describe, expect, it } from 'vitest';
import { extractH1, parseRequirements, parseTasks } from '../src/markdown.js';
import { parseFrontMatter } from '../src/metadata.js';

describe('markdown parsing', () => {
  it('extracts the first H1 only', () => {
    expect(extractH1('# Requirements Document\n\n## Intro')).toBe('Requirements Document');
    expect(extractH1('no heading here')).toBeUndefined();
  });

  it('parses requirement headings into ordered refs', () => {
    const content = [
      '## Requirements',
      '',
      '### Requirement 1: Canonical Model',
      'body',
      '### Requirement 2: Ownership',
      '### Requirement 10: Later',
    ].join('\n');
    const reqs = parseRequirements('SPEC-X', content);
    expect(reqs.map((r) => r.number)).toEqual([1, 2, 10]);
    expect(reqs[0]).toMatchObject({ id: 'SPEC-X:R1', title: 'Canonical Model' });
  });

  it('parses tasks including escaped-asterisk optional tasks and requirement refs', () => {
    const content = [
      '- [x] 1. Confirm model',
      '  - [x]\\* 1.2 Add fast-check',
      '    - _Requirements: 16.1_',
      '- [ ] 2. Fix table',
      '  - [ ] 2.1 Replace GSI',
      '    - _Requirements: 3.1, 3.2, 13.1_',
    ].join('\n');
    const tasks = parseTasks('SPEC-X', content);
    expect(tasks.map((t) => t.number)).toEqual(['1', '1.2', '2', '2.1']);
    expect(tasks.find((t) => t.number === '1.2')?.done).toBe(true);
    expect(tasks.find((t) => t.number === '2')?.done).toBe(false);
    expect(tasks.find((t) => t.number === '2.1')?.requirementNumbers).toEqual(['3.1', '3.2', '13.1']);
  });

  it('treats a mid-document --- as a divider, not front matter', () => {
    const raw = '# Title\n\nintro\n\n---\n\n## Section';
    const { frontMatter, content } = parseFrontMatter(raw);
    expect(frontMatter).toEqual({});
    expect(content).toContain('---');
  });

  it('parses real front matter at the top of the file', () => {
    const raw = '---\nspec_id: SPEC-RESERVE-001\ntitle: Reserve Funds\nversion: 1.0\nstatus: draft\n---\n# Body';
    const { frontMatter } = parseFrontMatter(raw);
    expect(frontMatter).toMatchObject({ spec_id: 'SPEC-RESERVE-001', title: 'Reserve Funds' });
  });
});
