import { Cli, c, Str, type t } from '../common.ts';
import { FmtPath } from '../u.fmt/u.path.ts';

export type KillFmtInput = {
  readonly root: string;
  readonly mode?: t.Cell.Services.ServiceMode;
  readonly dryRun: boolean;
  readonly force: boolean;
  readonly sessions: readonly KillFmtSession[];
  readonly resources: readonly KillFmtResource[];
};

type KillFmtSession = t.CellCli.Kill.SessionResult & {
  readonly terminate?: t.Process.Terminate.Result;
};

type KillFmtResource = t.CellCli.Kill.ResourceResult & {
  readonly mode: t.Cell.Services.ServiceMode;
  readonly terminate?: t.Process.Terminate.Port.Result;
};

type SummaryRow = {
  readonly label: string;
  readonly value: string;
};

type DetailTable = ReturnType<typeof Cli.Table.create>;

export function formatKillResult(res: KillFmtInput): string {
  const lines: string[] = [];
  lines.push(`${c.cyan('@sys/cell kill')}: ${FmtPath.display(res.root)}`);
  lines.push(...summaryTree(res));

  if (res.sessions.length > 0 || res.resources.length > 0) {
    lines.push('', detailText(res));
  }

  lines.push('', doneText(res), Cli.Fmt.hr({ color: 'gray', weight: 'light' }));
  return `\n${Str.trimEdgeNewlines(lines.join('\n'))}\n`;
}

function summaryTree(res: KillFmtInput): readonly string[] {
  const rows: SummaryRow[] = [
    { label: 'mode', value: c.white(res.mode ?? 'all') },
    ...(res.dryRun ? [{ label: 'dry-run', value: c.white('true') }] : []),
    ...(res.force ? [{ label: 'force', value: c.white('true') }] : []),
    { label: 'sessions', value: summaryValue(res.sessions) },
    { label: 'resources', value: summaryValue(res.resources) },
  ];
  const labelWidth = rows.reduce((max, row) => Math.max(max, row.label.length + 1), 0);

  return rows.map((row, index) => {
    const branch = c.gray(Cli.Fmt.Tree.branch(index === rows.length - 1, 2));
    const label = c.gray(`${row.label}:`.padEnd(labelWidth));
    return `  ${branch} ${label} ${row.value}`;
  });
}

function summaryValue(items: readonly unknown[]) {
  if (items.length === 0) return c.gray('none');
  return c.white(`${items.length} ${Str.plural(items.length, 'match', 'matches')}`);
}

function detailText(res: KillFmtInput) {
  const table = Cli.Table.create([]);
  res.sessions.forEach((session, index) => {
    if (index > 0) pushBlankRow(table);
    pushSessionRows(table, session);
  });
  res.resources.forEach((resource, index) => {
    if (res.sessions.length > 0 || index > 0) pushBlankRow(table);
    pushResourceRows(table, resource);
  });
  return Str.trimEdgeNewlines(String(table));
}

function pushSessionRows(table: DetailTable, session: KillFmtSession) {
  table.push([c.gray('session'), c.white(session.id)]);
  table.push([c.gray('  mode'), c.white(session.mode)]);
  table.push([c.gray('  pid'), c.white(String(session.pid))]);
  table.push([c.gray('  state'), c.white(session.state)]);
  table.push([c.gray('  heartbeat'), c.white(session.fresh ? 'fresh' : 'stale')]);
  table.push([c.gray('  status'), c.white(session.status)]);
  const action = sessionActionText(session);
  if (action) table.push([c.gray('  action'), c.white(action)]);
}

function pushResourceRows(table: DetailTable, resource: KillFmtResource) {
  table.push([c.gray('resource'), c.white(resourceLabel(resource))]);
  table.push([c.gray('  service'), c.white(resource.service)]);
  table.push([c.gray('  mode'), c.white(resource.mode)]);
  table.push([c.gray('  status'), c.white(resource.status)]);
  if (resource.listeners.length > 0) {
    table.push([c.gray('  listeners'), c.white(listenerText(resource.listeners))]);
  }
  const action = resourceActionText(resource);
  if (action) table.push([c.gray('  action'), c.white(action)]);
  if (resource.reason) table.push([c.gray('  reason'), c.white(resource.reason)]);
}

function pushBlankRow(table: DetailTable) {
  table.push(['', '']);
}

function sessionActionText(session: KillFmtSession) {
  if (session.terminate) {
    return session.terminate.actions.map((action) => action.signal).join(' → ');
  }
  if (session.status === 'would-terminate') return 'would signal supervisor';
  if (session.status === 'would-remove-stale') return 'would remove stale record';
  if (session.status === 'not-running') return 'removed stale record';
  if (session.status === 'stale-running') return 'skipped stale heartbeat';
  return undefined;
}

function resourceActionText(resource: KillFmtResource) {
  if (resource.terminate) {
    const signals = resource.terminate.results.flatMap((result) => {
      return result.actions.map((action) => action.signal);
    });
    return signals.length === 0 ? undefined : signals.join(' → ');
  }
  if (resource.status === 'would-terminate') return 'would signal listener';
  if (resource.status === 'skipped') return 'skipped listener cleanup';
  return undefined;
}

function listenerText(listeners: readonly t.CellCli.Kill.ResourceListener[]) {
  return listeners.map((listener) => {
    return listener.command ? `${listener.pid} ${listener.command}` : String(listener.pid);
  }).join(', ');
}

function resourceLabel(resource: t.CellCli.Kill.ResourceResult) {
  const host = resource.host ?? '*';
  return `tcp ${host}:${resource.port}`;
}

function doneText(res: KillFmtInput) {
  const totalSessions = res.sessions.length;
  const totalResources = res.resources.length;
  const total = totalSessions + totalResources;
  if (total === 0) return `${c.gray('done:')} no matching sessions or listeners`;

  if (res.dryRun) return `${c.gray('done:')} ${dryRunDoneText(res)}`;
  return `${c.gray('done:')} ${activeDoneText(res)}`;
}

function dryRunDoneText(res: KillFmtInput) {
  const sessions = res.sessions.filter((session) => session.status.startsWith('would-')).length;
  const listeners = res.resources.filter((resource) => resource.status === 'would-terminate')
    .length;
  return doneParts([
    ['sessions', sessions, 'would target'],
    ['listeners', listeners, 'would target'],
  ]) || 'no live sessions or listeners to target';
}

function activeDoneText(res: KillFmtInput) {
  const clearedSessions = res.sessions.filter(isClearedSession).length;
  const skippedSessions = res.sessions.filter(isSkippedSession).length;
  const clearedListeners = res.resources.filter(isClearedResource).length;
  const skippedListeners = res.resources.filter(isSkippedResource).length;

  return doneParts([
    ['sessions', clearedSessions, 'cleared', skippedSessions],
    ['listeners', clearedListeners, 'cleared', skippedListeners],
  ]) || 'no live sessions or listeners to clear';
}

function doneParts(parts: readonly DonePart[]) {
  return parts
    .filter((part) => part[1] > 0 || (part[3] ?? 0) > 0)
    .map((part) => {
      const [label, count, verb, skipped] = part;
      const primary = `${c.white(String(count))} ${verb}`;
      const skip = skipped === undefined ? '' : `, ${c.white(String(skipped))} skipped`;
      return `${c.gray(label)} ${primary}${skip}`;
    })
    .join('; ');
}

type DonePart = readonly [label: string, count: number, verb: string, skipped?: number];

function isClearedSession(session: KillFmtSession) {
  return ['not-running', 'terminated', 'killed'].includes(session.status);
}

function isSkippedSession(session: KillFmtSession) {
  return session.status === 'still-running' || session.status === 'stale-running';
}

function isClearedResource(resource: KillFmtResource) {
  return ['terminated', 'killed'].includes(resource.status);
}

function isSkippedResource(resource: KillFmtResource) {
  return ['partial', 'still-running', 'skipped'].includes(resource.status);
}
