import type { t } from '../common.ts';
import { stream } from './u.stream.ts';

/** Project the legacy operation to its terminal result. */
export function toDir(
  urls: readonly string[],
  dir: t.StringDir,
  options: t.HttpPull.Options,
): Promise<t.HttpPull.ToDir.Result> {
  return stream(urls, dir, options).done;
}
