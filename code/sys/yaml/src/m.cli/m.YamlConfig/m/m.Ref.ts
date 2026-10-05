import { Fs, type t } from '../common.ts';
import { RefPath } from '../u/u.path.ts';

/** YAML config selector helpers. */
export const Ref: t.YamlConfig.Ref.Lib = Object.freeze({
  resolve(input) {
    const label = input.label ?? 'config';
    const errorPrefix = input.errorPrefix ?? 'YamlConfig.Ref';
    const value = RefPath.requireValue(input.value, label, errorPrefix);
    const ext = RefPath.normalizeExt(input.ext);

    if (value.endsWith('/')) {
      throw new Error(`${errorPrefix}: ${label} must reference a YAML file or bare config name.`);
    }

    if (RefPath.isPathLike(value)) {
      const path = input.expandTilde === true && value.startsWith('~/')
        ? Fs.resolve(value, { expandTilde: true })
        : value;
      return {
        kind: 'path',
        input: value,
        path: path as t.StringPath,
        name: RefPath.nameFromPath(path, label, errorPrefix),
      };
    }

    return {
      kind: 'name',
      input: value,
      path: `${RefPath.trimTrailingSlash(input.dir)}/${value}${ext}` as t.StringPath,
      name: value,
    };
  },
});
