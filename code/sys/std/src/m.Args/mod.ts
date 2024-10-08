import { parseArgs as parse } from '@std/cli/parse-args';
import type { t } from '../common.ts';

/**
 * Tools for parsing and interpretting "arguments" (parameter strings).
 */
export const Args: t.ArgsLib = {
  parse,
};
