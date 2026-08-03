import type { t } from '../common.ts';
import { execute } from './u.execute.ts';

/** Start one legacy URL-array Pull operation. */
export function stream(
  urls: readonly string[],
  dir: t.StringDir,
  options: t.HttpPull.Options,
): t.HttpPull.Stream.Instance {
  return execute(urls, dir, options);
}
