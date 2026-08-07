/**
 * Lightweight, deterministic token estimation for spec + steering bloat analysis.
 *
 * Accurate tokenization requires model-specific BPE vocabularies (tiktoken for
 * GPT, Anthropic's tokenizer for Claude) which are heavy, network-fetched, and
 * would break this tool's deterministic, offline-friendly builds. Instead we use
 * a well-established heuristic — characters per token — with per-model ratios
 * that can be overridden in config. The result is a stable, dependency-free
 * estimate that is more than good enough to spot bloat in specs and steering docs.
 */

/** A named token-estimation profile. */
export interface TokenizerProfile {
  /** Stable key used in config (e.g. `opus-4.8`). */
  key: string;
  /** Human-readable column label for the summary table. */
  label: string;
  /**
   * Average characters per token for English prose/markdown. OpenAI's own
   * rule of thumb is ~4 chars/token (cl100k/o200k); Anthropic's Claude family
   * tends to be slightly denser at ~3.5.
   */
  charsPerToken: number;
}

/** Built-in profiles keyed by the identifier used in `handbook.yml`. */
export const TOKENIZER_PROFILES: Record<string, TokenizerProfile> = {
  'opus-4.8': { key: 'opus-4.8', label: 'Claude Opus 4.8', charsPerToken: 3.5 },
  'sonnet-4.5': { key: 'sonnet-4.5', label: 'Claude Sonnet 4.5', charsPerToken: 3.5 },
  haiku: { key: 'haiku', label: 'Claude Haiku', charsPerToken: 3.5 },
  'gpt-4o': { key: 'gpt-4o', label: 'GPT-4o (o200k)', charsPerToken: 4.0 },
  'gpt-4': { key: 'gpt-4', label: 'GPT-4 (cl100k)', charsPerToken: 4.0 },
  'gpt-3.5-turbo': { key: 'gpt-3.5-turbo', label: 'GPT-3.5 (cl100k)', charsPerToken: 4.0 },
};

/** Fallback profile used for unknown model keys (documented as generic). */
export const DEFAULT_TOKENIZER_PROFILE: TokenizerProfile = {
  key: 'generic',
  label: 'Generic (~4 c/t)',
  charsPerToken: 4.0,
};

/**
 * Resolve a model key to a profile, applying any per-model `charsPerToken`
 * override from config. Unknown keys fall back to a generic profile so the
 * table still renders (rather than throwing on a typo).
 */
export function resolveProfile(
  key: string,
  overrides?: Record<string, number>,
): TokenizerProfile {
  const base =
    TOKENIZER_PROFILES[key] ?? { ...DEFAULT_TOKENIZER_PROFILE, key, label: key };
  const override = overrides?.[key];
  return override && override > 0 ? { ...base, charsPerToken: override } : base;
}

/** Resolve a list of model keys to profiles (empty list falls back to Opus 4.8). */
export function resolveProfiles(
  keys: string[],
  overrides?: Record<string, number>,
): TokenizerProfile[] {
  const list = keys.length > 0 ? keys : ['opus-4.8'];
  return list.map((k) => resolveProfile(k, overrides));
}

/** Normalise line endings so counts are identical across platforms. */
function normalise(text: string): string {
  return text.replace(/\r\n/g, '\n');
}

/** Count characters (post line-ending normalisation). */
export function countChars(text: string): number {
  return normalise(text).length;
}

/** Count whitespace-delimited words. */
export function countWords(text: string): number {
  const trimmed = normalise(text).trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Estimate the number of tokens for `text` under a given profile. Runs of
 * whitespace are collapsed first (tokenizers merge most whitespace), then the
 * character count is divided by the profile's characters-per-token ratio.
 */
export function countTokens(text: string, profile: TokenizerProfile): number {
  const collapsed = normalise(text).replace(/\s+/g, ' ').trim();
  if (!collapsed) return 0;
  return Math.max(1, Math.round(collapsed.length / profile.charsPerToken));
}
