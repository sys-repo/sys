import { c, CliTable, Process, Str, type t } from '../common.ts';
import { FmtPath } from '../u.fmt/u.path.ts';
import { loadCanonicalRoot } from './u.root.ts';
import { CellSession } from './u.session.ts';

export type KillCellArgs = {
  readonly dir?: string;
  readonly mode?: t.Cell.Services.ServiceMode;
  readonly dryRun?: boolean;
  readonly force?: boolean;
  readonly sessionDir?: string;
  readonly freshFor?: t.Msecs;
};

export type KillCellResult = {
  readonly root: string;
  readonly mode?: t.Cell.Services.ServiceMode;
  readonly dryRun: boolean;
  readonly force: boolean;
  readonly sessions: readonly KillSessionResult[];
  readonly code: number;
};

type KillSessionResult = t.CellCli.Kill.SessionResult & {
  readonly terminate?: t.Process.Terminate.Result;
};

export async function killCell(args: KillCellArgs = {}): Promise<KillCellResult> {
  const root = await loadCanonicalRoot(args.dir);
  const options = sessionOptions(args);
  const sessions = (await CellSession.list(root, options)).filter((session) => {
    return args.mode === undefined || session.mode === args.mode;
  });

  const results: KillSessionResult[] = [];
  for (const session of sessions) results.push(await killSession(session, args));

  return {
    root,
    ...(args.mode ? { mode: args.mode } : {}),
    dryRun: args.dryRun ?? false,
    force: args.force ?? false,
    sessions: results,
    code: exitCode(results, args.dryRun ?? false),
  };
}

export function formatKillResult(res: KillCellResult): string {
  const lines: string[] = [];
  lines.push(`${c.cyan('Cell kill')}: ${FmtPath.display(res.root)}`);
  lines.push(`mode: ${res.mode ?? 'all'}`);
  if (res.dryRun) lines.push('dry-run: true');
  if (res.force) lines.push('force: true');
  lines.push('');

  if (res.sessions.length === 0) {
    lines.push('sessions: none');
  } else {
    res.sessions.forEach((session) => lines.push(String(sessionTable(session))));
  }

  lines.push('');
  lines.push(doneText(res));
  return Str.trimEdgeNewlines(lines.join('\n'));
}

export function toKillResult(
  input: t.CellCli.Input,
  res: KillCellResult,
): t.CellCli.Kill.Result {
  return {
    kind: 'kill',
    input,
    text: formatKillResult(res),
    code: res.code,
    root: res.root,
    ...(res.mode ? { mode: res.mode } : {}),
    dryRun: res.dryRun,
    force: res.force,
    sessions: res.sessions.map(publicSessionResult),
  };
}

async function killSession(
  session: CellSession.Session,
  args: KillCellArgs,
): Promise<KillSessionResult> {
  const options = sessionOptions(args);
  const fresh = CellSession.isFresh(session, options);
  const running = Process.isRunning(session.pid);

  if (args.dryRun) {
    return sessionResult(session, {
      fresh,
      status: running ? (fresh ? 'would-terminate' : 'stale-running') : 'would-remove-stale',
    });
  }

  if (!running) {
    await CellSession.remove(session, options);
    return sessionResult(session, { fresh, status: 'not-running' });
  }

  if (!fresh) return sessionResult(session, { fresh, status: 'stale-running' });

  const terminate = await Process.Terminate.pid(session.pid, { force: args.force ?? false });
  if (terminate.status !== 'still-running') await CellSession.remove(session, options);

  return sessionResult(session, { fresh, status: terminate.status, terminate });
}

function sessionOptions(args: KillCellArgs) {
  return { dir: args.sessionDir, freshFor: args.freshFor };
}

function sessionResult(
  session: CellSession.Session,
  input: {
    readonly fresh: boolean;
    readonly status: t.CellCli.Kill.SessionStatus;
    readonly terminate?: t.Process.Terminate.Result;
  },
): KillSessionResult {
  return {
    id: session.id,
    mode: session.mode,
    pid: session.pid,
    state: session.state,
    status: input.status,
    fresh: input.fresh,
    updatedAt: session.updatedAt,
    ...(input.terminate ? { terminate: input.terminate } : {}),
  };
}

function publicSessionResult(session: KillSessionResult): t.CellCli.Kill.SessionResult {
  return {
    id: session.id,
    mode: session.mode,
    pid: session.pid,
    state: session.state,
    status: session.status,
    fresh: session.fresh,
    updatedAt: session.updatedAt,
  };
}

function sessionTable(session: KillSessionResult) {
  const table = CliTable.create([]);
  table.push([c.gray('session'), c.white(session.id)]);
  table.push([c.gray('  mode'), c.white(session.mode)]);
  table.push([c.gray('  pid'), c.white(String(session.pid))]);
  table.push([c.gray('  state'), c.white(session.state)]);
  table.push([c.gray('  heartbeat'), c.white(session.fresh ? 'fresh' : 'stale')]);
  table.push([c.gray('  status'), c.white(session.status)]);
  const action = actionText(session);
  if (action) table.push([c.gray('  action'), c.white(action)]);
  return table;
}

function actionText(session: KillSessionResult) {
  if (session.terminate) {
    return session.terminate.actions.map((action) => action.signal).join(' → ');
  }
  if (session.status === 'would-terminate') return 'would signal';
  if (session.status === 'would-remove-stale') return 'would remove stale record';
  if (session.status === 'not-running') return 'removed stale record';
  if (session.status === 'stale-running') return 'skipped stale heartbeat';
  return undefined;
}

function doneText(res: KillCellResult) {
  const total = res.sessions.length;
  const cleared = res.sessions.filter(isCleared).length;
  const skipped = res.sessions.filter(isSkipped).length;
  const would = res.sessions.filter((session) => session.status.startsWith('would-')).length;
  const parts = res.dryRun ? [`would target ${would} ${Str.plural(would, 'session')}`] : [
    `cleared ${cleared} ${Str.plural(cleared, 'session')}`,
    `skipped ${skipped} ${Str.plural(skipped, 'session')}`,
  ];
  return `done: ${parts.join(', ')} (${total} matched)`;
}

function exitCode(sessions: readonly KillSessionResult[], dryRun: boolean) {
  if (dryRun) return 0;
  return sessions.some(isSkipped) ? 1 : 0;
}

function isCleared(session: KillSessionResult) {
  return ['not-running', 'terminated', 'killed'].includes(session.status);
}

function isSkipped(session: KillSessionResult) {
  return session.status === 'still-running' || session.status === 'stale-running';
}
