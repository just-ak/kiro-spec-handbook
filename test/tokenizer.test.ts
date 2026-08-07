import { describe, expect, it } from 'vitest';
import {
  countChars,
  countTokens,
  countWords,
  DEFAULT_TOKENIZER_PROFILE,
  resolveProfile,
  resolveProfiles,
  TOKENIZER_PROFILES,
} from '../src/tokenizer.js';
import { appendices, tokenSummary } from '../src/sections.js';
import { makeConfig, makeHandbook, makeSpec } from './fixtures.js';

describe('tokenizer counting', () => {
  it('normalises line endings for stable char counts', () => {
    expect(countChars('a\r\nb')).toBe(countChars('a\nb'));
  });

  it('counts words on whitespace boundaries', () => {
    expect(countWords('  one  two\nthree ')).toBe(3);
    expect(countWords('   ')).toBe(0);
  });

  it('estimates tokens via chars-per-token and never goes below 1 for content', () => {
    const opus = TOKENIZER_PROFILES['opus-4.8'];
    // 70 non-space chars / 3.5 = 20 tokens.
    const text = 'x'.repeat(70);
    expect(countTokens(text, opus)).toBe(20);
    expect(countTokens('', opus)).toBe(0);
    expect(countTokens('hi', opus)).toBe(1);
  });

  it('denser Claude ratio yields more tokens than GPT for the same text', () => {
    const text = 'The quick brown fox jumps over the lazy dog. '.repeat(20);
    const opus = countTokens(text, TOKENIZER_PROFILES['opus-4.8']);
    const gpt = countTokens(text, TOKENIZER_PROFILES['gpt-4o']);
    expect(opus).toBeGreaterThan(gpt);
  });
});

describe('tokenizer profile resolution', () => {
  it('resolves known keys and applies overrides', () => {
    expect(resolveProfile('haiku').label).toBe('Claude Haiku');
    expect(resolveProfile('haiku', { haiku: 2 }).charsPerToken).toBe(2);
  });

  it('falls back to a generic profile for unknown keys', () => {
    const p = resolveProfile('mystery-model');
    expect(p.charsPerToken).toBe(DEFAULT_TOKENIZER_PROFILE.charsPerToken);
    expect(p.label).toBe('mystery-model');
  });

  it('defaults to opus-4.8 when no models are configured', () => {
    const profiles = resolveProfiles([]);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].key).toBe('opus-4.8');
  });
});

describe('tokenSummary appendix', () => {
  const spec = makeSpec({
    slug: 'statements',
    title: 'Statements',
    documents: [
      {
        kind: 'requirements',
        absPath: '/r',
        relPath: 'r',
        content: '# Requirements\n\n' + 'lorem ipsum dolor sit amet '.repeat(40),
        frontMatter: {},
      },
    ],
  });

  it('produces a per-model table sorted with a totals row', async () => {
    const md = await tokenSummary(makeHandbook([spec]), makeConfig());
    expect(md).toContain('## Appendix B — Tokenizer Summary');
    expect(md).toContain('### Specifications');
    expect(md).toContain('Claude Opus 4.8');
    expect(md).toContain('GPT-4o (o200k)');
    expect(md).toContain('SPEC-STATEMENTS');
    expect(md).toContain('**Total**');
    // Spec id and title live in separate columns (no <br/> collision).
    expect(md).not.toContain('<br/>');
    expect(md).toContain('| Spec ID | Title |');
    // Rendered at the compact 8pt size so wide rows fit.
    expect(md).toContain('\\fontsize{8pt}');
  });

  it('renders in portrait for a few models and landscape for many', async () => {
    const portraitConfig = makeConfig();
    portraitConfig.tokenizer.models = ['opus-4.8', 'haiku', 'gpt-4o']; // 3 → portrait
    const portraitMd = await tokenSummary(makeHandbook([spec]), portraitConfig);
    expect(portraitMd).not.toContain('\\blandscape');

    const wideConfig = makeConfig();
    wideConfig.tokenizer.models = ['opus-4.8', 'sonnet-4.5', 'haiku', 'gpt-4o', 'gpt-4']; // 5 → landscape
    const wideMd = await tokenSummary(makeHandbook([spec]), wideConfig);
    expect(wideMd).toContain('\\blandscape');
  });

  it('returns empty string when disabled', async () => {
    const config = makeConfig();
    config.tokenizer.enabled = false;
    expect(await tokenSummary(makeHandbook([spec]), config)).toBe('');
  });

  it('is embedded under Appendices as Appendix B', async () => {
    const summary = await tokenSummary(makeHandbook([spec]), makeConfig());
    const out = appendices(makeHandbook([spec]), [summary]);
    expect(out).toContain('## Appendix A — Reference Files');
    expect(out).toContain('## Appendix B — Tokenizer Summary');
  });
});
