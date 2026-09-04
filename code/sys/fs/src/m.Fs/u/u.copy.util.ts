import { Path, type t } from '../common.ts';

/**
 * Helpers
 */
export const Wrangle = Object.freeze({
  options(input?: t.Fs.CopyFileOptions | t.FsCopyFilter): t.Fs.CopyFileOptions {
    if (!input) return {};
    if (typeof input === 'function') return { filter: input };
    return input;
  },

  filter(source: t.StringPath, target: t.StringPath, filter?: t.FsCopyFilter): boolean {
    if (!filter) return true;
    source = Path.absolute(source);
    target = Path.absolute(target);
    return filter({ source, target });
  },
});
