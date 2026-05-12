import type { t } from './common.ts';
import { atOffset, atPath, make } from './u/u.path.ts';

export const Path: t.YamlPathLib = {
  make,
  atOffset,
  atPath,
};
