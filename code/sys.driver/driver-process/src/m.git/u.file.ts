import { isMissingBinaryError, type t } from './common.ts';
import { invoke } from '../u.invoke.ts';

export const fileAtRef: t.GitFileAtRefFn = async (opts) => {
  const git = opts.bin?.git ?? 'git';
  const ref = opts.ref ?? 'HEAD';

  let res: t.Process.Output;
  try {
    res = await invoke({
      cmd: git,
      args: ['cat-file', 'blob', `${ref}:${opts.path}`],
      cwd: opts.cwd,
      silent: true,
    });
  } catch (error) {
    if (isMissingBinaryError(error)) return { ok: false, reason: 'missing-git', error };
    return { ok: false, reason: 'spawn-failed', error };
  }

  if (!res.success) {
    const failure = res.text.stderr || res.text.stdout || res.toString();
    const message = failure.toLowerCase();
    if (
      message.includes('not a git repository') ||
      message.includes('fatal: not a git repository')
    ) {
      return { ok: false, reason: 'not-a-repo', error: failure };
    }
    if (
      message.includes('exists on disk, but not in') ||
      (message.includes('path') && message.includes('does not exist')) ||
      message.includes('invalid object name') ||
      message.includes('not a valid object name')
    ) {
      return { ok: false, reason: 'not-found', error: failure };
    }
    return { ok: false, reason: 'spawn-failed', error: failure };
  }

  return { ok: true, bytes: res.stdout, text: res.text.stdout };
};
