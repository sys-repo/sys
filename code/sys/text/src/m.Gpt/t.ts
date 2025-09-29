import type { t } from './common.ts';

/**
 * Tools for working with GPT token string.
 */
export type GptTokenLib = {
  /** Meta-data about the GPT token library. */
  readonly info: GptTokenInfo;

  /** Count tokens in a single string. */
  count(text: string): number;

  /** Encode a string into token IDs. */
  encode(text: string): number[];
};

/**
 * Meta-data about the GPT token library.
 */
export type GptTokenInfo = {
  readonly tokenizer: 'gpt-tokenizer';
  readonly esm: t.JsrUrlRef;

  /** Core facts: */
  readonly encoding: 'o200k_base' | 'cl100k_base' | 'p50k_base' | 'p50k_edit' | 'r50k_base';
  readonly algorithm: 'BPE/tiktoken-compatible';
  readonly specialTokensPolicy: 'disallowed-by-default';
  readonly urn: t.StringUri;
};
