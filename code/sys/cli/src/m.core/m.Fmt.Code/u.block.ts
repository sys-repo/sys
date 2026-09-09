import { c } from '../common.ts';
import type { CliFormatCode } from './t.ts';
import { layout, sourceLines } from './u.layout.ts';

/** Format a terminal code snippet as an indented text block. */
export function block(text: string, options: CliFormatCode.Block.Options = {}): string {
  const result = layout(sourceLines(text), options);

  if (result.length === 0) return result;
  return options.tone === 'muted' ? c.gray(result) : result;
}
