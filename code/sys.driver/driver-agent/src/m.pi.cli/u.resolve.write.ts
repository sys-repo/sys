import { type t } from './common.ts';
import { PiEnv } from './u.env.ts';

export function resolveWrite(cwd: t.StringDir) {
  const scope = new Set<string>([cwd]);
  const tmpDir = PiEnv.toTmpDir();
  if (tmpDir) scope.add(tmpDir);
  return [...scope];
}
