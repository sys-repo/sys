import { countTokens, encode } from 'gpt-tokenizer';
import type { t } from './common.ts';

export const Token: t.GptTokenLib = {
  count(text) {
    return countTokens(text);
  },
  encode(text) {
    return encode(text);
  },
};
