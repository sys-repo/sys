import { type t } from './common.ts';
import { loadMounts } from './u.mounts.ts';

export const Mounts: t.SlcDataClient.Mounts.Lib = {
  load: loadMounts,
};
