import { Format as PathFormat } from '@sys/std/path';
import type { t } from './common.ts';

/** Common formatting helpers when working with a CLI. */
export const Fmt: t.CliFormatLib = {
  path: PathFormat.string,
};
