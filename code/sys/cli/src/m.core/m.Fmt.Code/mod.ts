/**
 * @module
 * Code block formatting extension for CLI output.
 */
import { type t } from '../common.ts';
import { Fmt as Base } from '../m.Fmt/mod.ts';
import { Code } from './m.Code.ts';

export { Code } from './m.Code.ts';
export type * from './t.ts';

/** Command-line formatting helper library with code block formatting. */
export const Fmt: t.CliFormatCode.Fmt.Lib = {
  ...Base,
  Code,
};
