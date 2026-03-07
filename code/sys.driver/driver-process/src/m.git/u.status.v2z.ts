import { type t, Process, isMissingBinaryError } from './common.ts';

export const statusPorcelainV2Z: t.GitStatusPorcelainV2ZFn = async (opts = {}) => {
  const git = opts.bin?.git ?? 'git';
  const args = ['status', '--porcelain=v2', '-z'];
  if (opts.untracked !== false) {
    args.push('--untracked-files=all');
  }
  if (opts.findRenames !== false) {
    args.push('--find-renames');
  }

  let res: t.ProcOutput;
  try {
    res = await Process.invoke({
      cmd: git,
      args,
      cwd: opts.cwd,
      silent: true,
    });
  } catch (error) {
    if (isMissingBinaryError(error)) {
      return { ok: false, reason: 'missing-git', error };
    }
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
    return { ok: false, reason: 'spawn-failed', error: failure };
  }

  return { ok: true, stdout: res.text.stdout || '' };
};
