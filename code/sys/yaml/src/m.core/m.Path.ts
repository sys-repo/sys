import type { t } from './common.ts';

import { atOffset } from './u.path.atOffset.ts';
import { atPath } from './u.path.atPath.ts';
import { make } from './u.path.create.ts';

export const Path: t.YamlPathLib = {
  make,
  atOffset,
  atPath,
};
