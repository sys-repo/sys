import type { t } from './common.ts';
import { cursor } from './u.cursor.ts';
import { Durations } from './u.duration.ts';
import { mapToSource } from './u.map.ts';
import { normalize } from './u.normalize.ts';
import { Ops } from './u.ops.ts';
import { resolve } from './u.resolve.ts';
import { Time } from './u.time.ts';
import { validate } from './u.validate.ts';

export const Composite: t.TimecodeCompositeLib = {
  Ops,
  Durations,
  Time,
  cursor,
  mapToSource,
  normalize,
  resolve,
  validate,
};
