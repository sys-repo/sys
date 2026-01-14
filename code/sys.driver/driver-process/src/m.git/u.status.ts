import { Process } from './common.ts';
import type { t } from './common.ts';
import { isMissingBinaryError } from '../u.probe/mod.ts';

type ProcInvokeResult = Awaited<ReturnType<typeof Process.invoke>>;

const VALID_CODES = new Set<t.GitStatusCode>([' ', 'M', 'A', 'D', 'R', 'C', 'U', '?']);

export const status: t.GitStatusFn = async (opts = {}) => {
  const git = opts.bin?.git ?? 'git';
  const args = ['status', '--porcelain'];
  if (opts.untracked === false) {
    args.push('--untracked-files=no');
  }

  let res: ProcInvokeResult;
  try {
    res = await Process.invoke({
      cmd: git,
      args,
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
    if (message.includes('not a git repository') || message.includes('fatal: not a git repository')) {
      return { ok: false, reason: 'not-a-repo', error: failure };
    }
    return { ok: false, reason: 'spawn-failed', error: failure };
  }

  const output = res.text.stdout || res.text.stderr || '';
  const entries: t.GitStatusEntry[] = [];
  for (const line of output.split('\n')) {
    if (line === '') continue;
    if (line.length < 3) return { ok: false, reason: 'parse-failed' };

    const index = line[0] as t.GitStatusCode;
    const worktree = line[1] as t.GitStatusCode;
    if (!VALID_CODES.has(index) || !VALID_CODES.has(worktree)) {
      return { ok: false, reason: 'parse-failed' };
    }

    const payload = line.slice(3);
    if (payload === '') {
      return { ok: false, reason: 'parse-failed' };
    }

    const arrowIndex = payload.indexOf(' -> ');
    if (arrowIndex !== -1) {
      const path = payload.slice(0, arrowIndex);
      const pathTo = payload.slice(arrowIndex + 4);
      entries.push({ index, worktree, path, pathTo });
    } else {
      entries.push({ index, worktree, path: payload });
    }
  }

  return { ok: true, entries };
};
