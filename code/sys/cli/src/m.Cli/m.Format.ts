import { Format as PathFormat } from '@sys/std/path';
import type { CliFormatLib } from './t.ts';

/** Common formatting helpers when working with a CLI. */
export const Format: CliFormatLib = {
  path: PathFormat.string,
};
