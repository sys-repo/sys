import type { CliFormatCode } from './t.ts';
import { block } from './u.block.ts';
import { highlight } from './u.highlight.ts';

/** Code block formatting helpers. */
export const Code: CliFormatCode.Lib = {
  block,
  highlight,
};
