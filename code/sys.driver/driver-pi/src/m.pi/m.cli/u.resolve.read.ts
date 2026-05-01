import { type t } from './common.ts';
import { PiEnv } from './u.env.ts';

export async function resolveRead(
  cwd: t.StringDir,
  denoDir: t.StringDir,
  extra: readonly t.StringPath[] = [],
) {
  const scope = new Set<string>([cwd, denoDir]);
  for (const path of extra) scope.add(path);
  for (const path of toExecutableReadScope()) scope.add(path);
  const tmpDir = await PiEnv.toTmpDir();
  if (tmpDir) scope.add(tmpDir);
  return [...scope];
}

/**
 * Helpers:
 */
function toExecutableReadScope() {
  const scope = new Set<string>(['/bin/bash', '/bin/sh', '/bin/zsh']);
  scope.add(PiEnv.toShellPath());
  return [...scope];
}
