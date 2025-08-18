import { type t } from './common.ts';

/**
 * Tools for working with GPT token string.
 */
export type GptTokenLib = {
  /** Count tokens in a single string. */
  count(text: string): number;

  /** Encode a string into token IDs. */
  encode(text: string): number[];
};
