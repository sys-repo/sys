import { Cell } from '../../m.cell/mod.ts';
import { serviceStatusesOf } from '../../m.cell/u.services/u.status.ts';
import { c, Cli, CliTable, pkg, Str, type t, Time, Try } from '../common.ts';
import { smallCountText } from '../u.fmt/u.count.ts';
import { elapsedSuffix } from '../u.fmt/u.elapsed.ts';
import { Fmt } from '../u.fmt/u.mod.ts';
import { FmtPath } from '../u.fmt/u.path.ts';
import { canonicalRoot } from './u.root.ts';
import { CellSession } from './u.session.ts';
import { createShutdownSignal, isSignalShutdownReason, type ShutdownSignal } from './u.shutdown.ts';

/**
 * Cell service-start input with renderer-neutral lifecycle hooks.
 *
 * Hooks report lifecycle facts only; the caller retains terminal ownership.
 */
export type StartCellArgs = {
  /** Cell root to load; omit to discover from the current working directory. */
  readonly dir?: string;
  /** Service graph mode selected for this start. */
  readonly mode?: t.Cell.Services.ServiceMode;
  /** Signals the resolved service count immediately before owner startup begins. */
  readonly onStarting?: (serviceCount: number) => void;
  /** Supplies service-body content after all owners have started. */
  readonly onReady?: (input: StartCellReady) => void;
};

/** Service-body presentation supplied when startup reaches ready. */
export type StartCellReady = {
  /** Stable append-only rendering at the ambient output width. */
  readonly text: string;
  /** Re-renders the same body for an explicit viewport width. */
  readonly render: (width?: number) => string;
};

/** Terminal-neutral result from a completed Cell service start. */
export type StartCellResult = {
  readonly root: string;
  readonly services: number;
  readonly mode: t.Cell.Services.ServiceMode;
  /** Service-status body without the application header or completion summary. */
  readonly serviceText: string;
};

/** Starts Cell services while leaving terminal presentation to the lifecycle-hook caller. */
export async function startCell(args: StartCellArgs = {}): Promise<StartCellResult> {
  const cell = await Cell.load(args.dir);
  const mode = args.mode ?? 'default';
  const sessionRoot = await canonicalRoot(cell.root);
  const shutdown = createShutdownSignal();
  let started: t.Cell.Services.Started | undefined;
  let serviceText = '';
  let finalReason: string | undefined;
  let session: CellSession.Handle | undefined;

  try {
    const plan = await Cell.Services.plan(cell, { mode });
    session = await CellSession.create({
      root: sessionRoot,
      mode,
      pid: Deno.pid,
      services: plan.services.map((item) => ({
        name: item.service.name,
        use: item.service.use,
        from: item.service.from,
      })),
    });
    await session.resources(await sessionResources(cell, mode));

    args.onStarting?.(plan.services.length);
    started = await Cell.start(cell, { until: shutdown.signal, mode });
    await session.ready();

    const services = serviceStatusesOf(started);
    const render = (width?: number) => Fmt.Services.started({ services, width });
    serviceText = render();
    args.onReady?.({ text: serviceText, render });
    await Promise.race([Cell.Services.wait(started), shutdown.done]);
  } finally {
    finalReason = shutdown.reason;
    await session?.stopping().catch(() => undefined);
    try {
      await closeAndDispose(started, shutdown);
    } finally {
      await session?.dispose().catch(() => undefined);
    }
  }

  if (isSignalShutdownReason(finalReason)) Deno.exitCode = 130;

  return {
    root: cell.root,
    services: started?.services.length ?? 0,
    mode,
    serviceText,
  };
}

async function sessionResources(
  cell: t.Cell.Instance,
  mode: t.Cell.Services.ServiceMode,
): Promise<readonly CellSession.Resource[]> {
  const plan = await Cell.Services.resources(cell, { mode });
  return plan.resources.map((item) => ({
    service: item.service.name,
    resource: item.resource,
  }));
}

async function closeAndDispose(
  started: t.Cell.Services.Started | undefined,
  shutdown: ShutdownSignal,
) {
  const close = await Try.run(() => started?.close(shutdown.reason ?? 'cell.start.finished'));
  try {
    if (!close.result.ok) throw close.result.error;
  } finally {
    shutdown.dispose();
  }
}

export function startServicesText(
  count: number,
  startedAt?: t.UnixTimestamp,
  now: t.UnixTimestamp = Time.now.timestamp,
): string {
  const text = count === 1
    ? 'starting service...'
    : `starting ${smallCountText(count)} ${Str.plural(count, 'service')}...`;
  return `${text}${elapsedSuffix({ startedAt, now })}`;
}

export function formatStartHeader(width?: number): string {
  return Cli.Fmt.Header.rows({ pkg, tone: 'green', width }).join('\n');
}

export function formatStartResult(res: StartCellResult): string {
  const table = CliTable.create([]);
  table.push([c.gray('root'), FmtPath.display(res.root)]);
  table.push([c.gray('services'), c.white(String(res.services))]);
  if (res.mode !== 'default') table.push([c.gray('mode'), c.white(res.mode)]);
  return Str.trimEdgeNewlines(String(table));
}

export function formatStartOutput(res: StartCellResult): string {
  const header = formatStartHeader();
  const summary = formatStartResult(res);
  return res.serviceText ? `${header}\n${res.serviceText}\n${summary}` : `${header}\n\n${summary}`;
}

export function toStartResult(
  input: t.CellCli.Input,
  res: StartCellResult,
): t.CellCli.Start.Result {
  return {
    kind: 'start',
    input,
    text: formatStartOutput(res),
    root: res.root,
    services: res.services,
    ...(res.mode !== 'default' ? { mode: res.mode } : {}),
  };
}
