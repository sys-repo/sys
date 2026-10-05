import { type t } from '../common.ts';
import { entryFromStat } from './u.entry.ts';
import { fail } from './u.error.ts';
import { absolutePath, assertInsideRealScope, realScope, type Scope } from './u.path.ts';

export type RealDirectory<
  Fs extends t.FilesFs.Capability.Readonly = t.FilesFs.Capability.Readonly,
> = {
  readonly scope: Scope<Fs>;
  readonly real: t.StringAbsolutePath;
  readonly entry: t.Files.Entry;
};

/** Resolve and validate a visible directory under a canonical files/fs scope. */
export const realDirectory = async <Fs extends t.FilesFs.Capability.Readonly>(
  scope: Scope<Fs>,
  path: t.Files.String.Path,
): Promise<RealDirectory<Fs>> => {
  const absolute = absolutePath(scope, path);
  const canonicalScope = await realScope(scope);
  const real = await assertInsideRealScope(canonicalScope, absolute);
  if (!real) throw fail('FilesFsError.NotFound', `Directory not found: ${path}`);

  const info = await canonicalScope.fs.stat(real);
  if (!info) throw fail('FilesFsError.NotFound', `Directory not found: ${path}`);
  const entry = entryFromStat(path, info);
  if (entry.kind !== 'dir') throw fail('FilesFsError.NotDirectory', `Not a directory: ${path}`);

  return { scope: canonicalScope, real, entry };
};
