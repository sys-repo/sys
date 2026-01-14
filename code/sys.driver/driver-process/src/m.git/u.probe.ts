import { type t } from './common.ts';
import { checkVersion, isMissingBinaryError } from '../u.probe/mod.ts';

export const probe: t.GitProbeFn = async (opts = {}) => {
  const git = opts.bin?.git ?? 'git';
  const result = await checkVersion(git, ['--version']);
  if (result.ok) {
    return { ok: true, bin: { git } };
  }

  const missing = isMissingBinaryError(result.error);
  return {
    ok: false,
    reason: missing ? 'missing-git' : 'spawn-failed',
    hint: missing
      ? 'git not found. Install Git and ensure it is on PATH.'
      : 'git probe failed. Ensure git is executable and on PATH.',
    error: result.error,
  };
};
