import { type t } from './common.ts';
import { PiEnv } from './u.env.ts';

export function resolveWrite(cwd: t.StringDir, extra: readonly t.StringPath[] = []) {
  const scope = new Set<string>([cwd]);
  for (const path of extra) scope.add(path);
  const tmpDir = PiEnv.toTmpDir();
  if (tmpDir) scope.add(tmpDir);
  return [...scope];
}
