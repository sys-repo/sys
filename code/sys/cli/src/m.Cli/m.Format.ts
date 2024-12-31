import type { t } from './common.ts';
import { Format as PathFormat } from '@sys/std/path';

/** Common formatting helpers when working with a CLI. */
export const Format: t.CliFormatLib = {
  path: PathFormat.string,
};
