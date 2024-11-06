import { ObjectPath, type t } from './common.ts';
import { Path } from './u.Path.ts';

type O = Record<string, unknown>;

export const Mutate = {
  value: ObjectPath.Mutate.value,
  delete: ObjectPath.Mutate.delete,
  ensure: ObjectPath.Mutate.ensure,

  meta(d: O, paths: t.CmdBarPaths, mutate: (meta: t.CmdBarMeta) => void) {
    const resolve = Path.resolver(paths);
    const meta = resolve(d).meta;
    mutate(meta);
    if (!ObjectPath.exists(d, paths.meta)) Mutate.value(d, paths.meta, meta);
  },
} as const;
