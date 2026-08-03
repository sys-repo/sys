import type { t } from './common.ts';

import { toDir } from './u/u.dir.ts';
import { PullMap as Map } from './u/u.map.ts';
import { start } from './u/u.start.ts';
import { stream } from './u/u.stream.ts';

/** Materialize legacy URL mirrors or checksum-pinned Rooted resources. */
export const HttpPull: t.HttpPull.Lib = {
  Map,
  start,
  toDir,
  stream,
};
