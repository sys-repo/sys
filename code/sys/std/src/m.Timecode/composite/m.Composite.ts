import type { t } from './common.ts';

import { cursor } from './u.cursor.ts';
import { Durations } from './u.duration.ts';
import { Map } from './m.Map.ts';
import { normalize } from './u.normalize.ts';
import { Ops } from './u.ops.ts';
import { resolve } from './u.resolve.ts';
import { Time } from './u.time.ts';
import { toVirtualTimeline } from './u.toVirtualTimeline.ts';
import { validate } from './u.validate.ts';

export const Composite: t.TimecodeCompositeLib = {
  Ops,
  Map,
  Durations,
  Time,
  toVirtualTimeline,
  cursor,
  normalize,
  resolve,
  validate,
};
