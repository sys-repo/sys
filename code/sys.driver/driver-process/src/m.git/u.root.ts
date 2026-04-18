import { type t, checkVersion, isMissingBinaryError, Process } from './common.ts';

const HINT_NOT_FOUND = 'git not found. Install Git and ensure it is on PATH.';
const HINT_FAILED = 'git root probe failed. Ensure git is executable and on PATH.';

export const root: t.GitRootFn = async (opts = {}) => {
  const git = opts.bin?.git ?? 'git';
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

  let res: t.Process.Output;
  try {
    res = await Process.invoke({
      cmd: git,
      args: ['rev-parse', '--show-toplevel'],
      cwd: opts.cwd,
      silent: true,
    });
  } catch (error) {
    if (isMissingBinaryError(error)) {
      return { ok: false, reason: 'missing-git', hint: HINT_NOT_FOUND, error };
    }
    return { ok: false, reason: 'spawn-failed', hint: HINT_FAILED, error };
  }

  if (!res.success) {
    const failure = res.text.stderr || res.text.stdout || res.toString();
    const message = failure.toLowerCase();
    if (
      message.includes('not a git repository') ||
      message.includes('fatal: not a git repository')
    ) {
      return { ok: false, reason: 'not-a-repo', hint: 'Not a git repository.', error: failure };
    }
    return { ok: false, reason: 'spawn-failed', hint: HINT_FAILED, error: failure };
  }

  const path = (res.text.stdout || res.text.stderr || '').trim();
  if (!path) {
    return { ok: false, reason: 'parse-failed', hint: HINT_FAILED };
  }

  return {
    ok: true,
    bin: { git },
    root: path as t.StringDir,
  };
};
