import type { t } from './common.ts';

import { toDir } from './u/u.dir.ts';
import { PullMap as Map } from './u/u.map.ts';
import { stream } from './u/u.stream.ts';

/** HTTP-to-filesystem pull helpers with batch and streaming progress APIs. */
export const HttpPull: t.HttpPull.Lib = {
  Map,
  toDir,
  stream,
};
