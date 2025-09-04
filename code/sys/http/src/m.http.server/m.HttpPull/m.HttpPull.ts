import type { t } from './common.ts';

import { PullMap as Map } from './u.Map.ts';
import { stream } from './u.stream.ts';
import { toDir } from './u.toDir.ts';

export const HttpPull: t.HttpPullLib = {
  Map,
  toDir,
  stream,
};
