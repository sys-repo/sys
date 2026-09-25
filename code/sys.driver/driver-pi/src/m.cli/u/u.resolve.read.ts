import { Arr, type t } from '../common.ts';
import { PiEnv } from './u.env.ts';
import { resolveTempArtifactRoots } from './u.runtime.ts';

export async function resolveRead(
  cwd: t.StringDir,
  denoDir: t.StringDir,
  extra: readonly t.StringPath[] = [],
) {
  return Arr.uniq([
    cwd,
    denoDir,
    ...extra,
    ...toExecutableReadScope(),
    ...await resolveTempArtifactRoots(),
  ]);
}

/**
 * Helpers:
 */
function toExecutableReadScope() {
  return Arr.uniq(['/bin/bash', '/bin/sh', '/bin/zsh', PiEnv.toShellPath()]);
}
