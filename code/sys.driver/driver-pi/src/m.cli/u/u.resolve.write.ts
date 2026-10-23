import { Arr, type t } from '../common.ts';
import { resolveTempArtifactRoots } from './u.runtime.ts';

export async function resolveWrite(cwd: t.StringDir, extra: readonly t.StringPath[] = []) {
  return Arr.uniq([
    cwd,
    ...extra,
    ...await resolveTempArtifactRoots(),
  ]);
}
