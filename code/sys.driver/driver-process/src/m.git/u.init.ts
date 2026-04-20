import { type t, checkVersion, Fs, isMissingBinaryError, Process } from './common.ts';

const HINT_NOT_FOUND = 'git not found. Install Git and ensure it is on PATH.';
const HINT_FAILED = 'git init failed. Ensure git is executable and on PATH.';

export const init: t.GitInitFn = async (opts = {}) => {
  const git = opts.bin?.git ?? 'git';
  const cwd = opts.cwd ?? Fs.cwd();
  const verify = await checkVersion(git);
  if (!verify.ok) {
    const missing = isMissingBinaryError(verify.error);
    return {
      ok: false,
      reason: missing ? 'missing-git' : 'spawn-failed',
      hint: missing ? HINT_NOT_FOUND : HINT_FAILED,
      error: verify.error,
    };
  }

  try {
    const res = await Process.invoke({
      cmd: git,
      args: ['init'],
      cwd,
      silent: true,
    });
    if (!res.success) {
      return {
        ok: false,
        reason: 'spawn-failed',
        hint: HINT_FAILED,
        error: res.text.stderr || res.text.stdout || res.toString(),
      };
    }
  } catch (error) {
    if (isMissingBinaryError(error)) {
      return { ok: false, reason: 'missing-git', hint: HINT_NOT_FOUND, error };
    }
    return { ok: false, reason: 'spawn-failed', hint: HINT_FAILED, error };
  }

  return {
    ok: true,
    bin: { git },
    cwd,
  };
};
