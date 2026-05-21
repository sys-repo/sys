import { type t } from './common.ts';
import { toReadonly } from './m.Files.toReadonly.ts';
import { watch } from './u.Files.watch.ts';

/**
 * Adapt `@sys/fs` into the live readonly+watch capability expected by `@sys/model/files/fs`.
 */
export const toLive: t.FsCapability.Files.ReadonlyLib['live'] = (fs) => {
  const base = toReadonly(fs);
  return Object.freeze({
    ...base,
    watch: (path, options) => watch(fs, path, options),
  });
};
