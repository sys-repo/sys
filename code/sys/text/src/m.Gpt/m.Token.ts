import { countTokens, encode } from 'gpt-tokenizer';
import { type t, Jsr, pkg } from './common.ts';

export const Token: t.GptTokenLib = {
  count(text) {
    const opts = wrangle.opts();
    return opts ? countTokens(text, opts) : countTokens(text);
  },
  encode(text) {
    const opts = wrangle.opts();
    return opts ? encode(text, opts) : encode(text);
  },
  get info() {
    return info;
  },
};

/**
 * Constants:
 */
const info: t.GptTokenInfo = {
  tokenizer: 'gpt-tokenizer',
  encoding: 'o200k_base', //                       ← default encoding used by this import
  algorithm: 'BPE/tiktoken-compatible', //         ← same merges/vocab rules as OpenAI’s tiktoken
  specialTokensPolicy: 'disallowed-by-default', // ← encode/count - doesn't accept specials unless explicitly allowed.
  get urn() {
    return wrangle.urn(info);
  },
  esm: {
    contract: Jsr.Url.Pkg.file(pkg, 'src/m.Gpt/t.ts'),
    module: Jsr.Url.Pkg.file(pkg, 'src/m.Gpt/m.Token.ts'),
  },
};

/**
 * Helpers:
 */
const wrangle = {
  opts() {
    return Token.info.specialTokensPolicy === 'disallowed-by-default'
      ? { disallowedSpecial: 'all' as const }
      : undefined;
  },

  urn(info: t.GptTokenInfo) {
    const encode = encodeURIComponent;
    const enc = info.encoding;
    const alg = info.algorithm === 'BPE/tiktoken-compatible' ? 'bpe-tk' : encode(info.algorithm);
    const special =
      info.specialTokensPolicy === 'disallowed-by-default'
        ? 'disallowed'
        : encode(info.specialTokensPolicy);
    return `urn:sys:${info.tokenizer}?enc=${enc}&alg=${alg}&special=${special}`;
  },
} as const;
