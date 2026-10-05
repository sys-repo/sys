import { type t } from '../common.ts';
import { toWritable } from './m.Files.toWritable.ts';
import { isAtomicTempPath } from '../u/u.Files.atomic.ts';
import { watch } from '../u/u.Files.watch.ts';

/**
 * Adapt `@sys/fs` into the writable live capability expected by `@sys/model/files/fs`.
 */
export const toLiveWritable: t.FsCapability.Files.WritableLib['live'] = (fs) => {
  const base = toWritable(fs);
  return Object.freeze({
    ...base,
    watch(path, options) {
      return watch(fs, path, {
        ...options,
        includePath: (eventPath) => !isAtomicTempPath(fs, eventPath),
      });
    },
  });
};
