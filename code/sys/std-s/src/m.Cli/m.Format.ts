import type { t } from './common.ts';
import { Format as PathFormat } from '@sys/std/path';

export const Format: t.CliFormatLib = {
  path: PathFormat.string,
};
