import { Cell } from '../../m.cell/mod.ts';
import { serviceStatusesOf } from '../../m.cell/u.services/u.status.ts';
import { c, Cli, CliTable, Str, type t, Time, Try } from '../common.ts';
import { smallCountText } from '../u.fmt/u.count.ts';
import { elapsedSuffix } from '../u.fmt/u.elapsed.ts';
import { Fmt } from '../u.fmt/u.mod.ts';
import { FmtPath } from '../u.fmt/u.path.ts';
import { createShutdownSignal, isSignalShutdownReason } from './u.shutdown.ts';

export type StartCellArgs = {
  readonly dir?: string;
  readonly mode?: t.Cell.Services.ServiceMode;
  readonly onStarted?: (text: string) => void;
};

export type StartCellResult = {
  readonly root: string;
  readonly services: number;
  readonly mode: t.Cell.Services.ServiceMode;
  readonly serviceText: string;
};

export async function startCell(args: StartCellArgs = {}): Promise<StartCellResult> {
  const cell = await Cell.load(args.dir);
  const mode = args.mode ?? 'default';
  const shutdown = createShutdownSignal();
  let started: t.Cell.Services.Started | undefined;
  let serviceText = '';
  let finalReason: string | undefined;

  try {
    const serviceCount = cell.descriptor.services?.length ?? 0;
    started = await startServices(cell, { until: shutdown.signal, mode }, serviceCount);
    serviceText = Fmt.Services.started({ services: serviceStatusesOf(started) });
    if (serviceText) args.onStarted?.(serviceText);
    await Promise.race([Cell.Services.wait(started), shutdown.done]);
  } finally {
    finalReason = shutdown.reason;
    await closeAndDispose(started, shutdown);
  }

  if (isSignalShutdownReason(finalReason)) Deno.exitCode = 130;

  return {
    root: cell.root,
    services: started?.services.length ?? 0,
    mode,
    serviceText,
  };
}

async function startServices(
  cell: t.Cell.Instance,
  options: t.Cell.Services.StartOptions,
  serviceCount: number,
): Promise<t.Cell.Services.Started> {
  const silent = !Cli.Is.terminal('stdout');
  const startedAt = Time.now.timestamp;
  const spinner = Cli.spinner(Cli.Fmt.spinnerText(startServicesText(serviceCount)), { silent });
  const timer = silent ? undefined : globalThis.setInterval(() => {
    spinner.text = Cli.Fmt.spinnerText(startServicesText(serviceCount, startedAt));
  }, 1000);

  try {
    return await Cell.start(cell, options);
  } finally {
    if (timer !== undefined) globalThis.clearInterval(timer);
    spinner.stop();
  }
}

async function closeAndDispose(
  started: t.Cell.Services.Started | undefined,
  shutdown: ReturnType<typeof createShutdownSignal>,
) {
  const close = await Try.run(async () => started?.close(shutdown.reason ?? 'cell.start.finished'));
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

export function formatStartResult(res: StartCellResult): string {
  const table = CliTable.create([]);
  table.push([c.gray('root'), FmtPath.display(res.root)]);
  table.push([c.gray('services'), c.white(String(res.services))]);
  if (res.mode !== 'default') table.push([c.gray('mode'), c.white(res.mode)]);
  return Str.trimEdgeNewlines(String(table));
}

export function formatStartOutput(res: StartCellResult): string {
  const summary = formatStartResult(res);
  return res.serviceText ? `${res.serviceText}\n${summary}` : summary;
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
