import type { t } from './common.ts';

import { toDir } from './u.dir.ts';
import { PullMap as Map } from './u.map.ts';
import { stream } from './u.stream.ts';

export const HttpPull: t.HttpPullLib = {
  Map,
  toDir,
  stream,
};
