import { type t } from './common.ts';
import { loadMounts } from './u.mounts.ts';

export const Mounts: t.SlugDataClient.Mounts.Lib = {
  load: loadMounts,
};
