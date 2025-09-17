import type { t } from './common.ts';

import { atOffset } from './m.Path.atOffset.ts';
import { atPath } from './m.Path.atPath.ts';
import { create } from './m.Path.create.ts';

export const Path: t.YamlPathLib = {
  create,
  atOffset,
  atPath,
};
