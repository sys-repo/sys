import { Cell } from '../../m.cell/mod.ts';
import { serviceStatusesOf } from '../../m.cell/u.services/u.status.ts';
import { c, Cli, CliTable, Is, Num, Pkg, Str, type t, Time } from '../common.ts';
import { smallCountText } from '../u.fmt/u.count.ts';
import { elapsedSuffix } from '../u.fmt/u.elapsed.ts';
import { Fmt } from '../u.fmt/u.mod.ts';
import { FmtPath } from '../u.fmt/u.path.ts';
import { canonicalRoot } from '../u/u.root.ts';
import { CellSession } from '../u/u.session.ts';
import { mergeFailures } from './u.failure.ts';
import { createShutdownSignal, type ShutdownReason, type ShutdownSignal } from './u.shutdown.ts';

/**
 * Cell service-start input with caller-owned lifecycle controls and effect-free reporting hooks.
 *
 * Hooks report lifecycle facts and formatted body content without writing to the terminal; the
 * caller retains terminal ownership.
 */
export type StartCellArgs = {
  /** Service graph mode selected for this start. */
  mode?: t.Cell.Services.ServiceMode;
  /** Optional command-owned shutdown authority transferred to this lifecycle. */
  shutdown?: ShutdownSignal;
  /** Signals the resolved service count immediately before owner startup begins. */
  onStarting?: (serviceCount: number) => void;
  /** Supplies service-body content after all owners have started. */
  onReady?: (input: StartCellReady) => void;
};

/** Private presentation options selected by the terminal-owning reporter. */
export type StartCellRenderOptions = {
  /** Optional viewport width for responsive terminal presentation. */
  width?: number;
  /** Whether final eligible service labels should use OSC 8 hyperlinks. */
  hyperlinks?: boolean;
};

/** Service-body presentation supplied when startup reaches ready. */
export type StartCellReady = {
  /** Stable append-only rendering at the ambient output width. */
  readonly text: string;
  /** Re-renders the same body for an explicit presentation context. */
  readonly render: (options?: StartCellRenderOptions) => string;
};

/** Effect-free terminal result from one Cell service-start lifecycle. */
export type StartCellResult = {
  readonly root: string;
  readonly services: number;
  readonly mode: t.Cell.Services.ServiceMode;
  /** Ready service-status body, or empty when interruption wins before ready. */
  readonly serviceText: string;
};

/** Loads the Cell once before start presentation acquires terminal ownership. */
export function loadStartCell(dir?: string): Promise<t.Cell.Instance> {
  return Cell.load(dir);
}

/** Runs one loaded Cell start lifecycle while leaving terminal effects to the hook caller. */
export async function startCell(
  cell: t.Cell.Instance,
  args: StartCellArgs = {},
): Promise<StartCellResult> {
  const mode = args.mode ?? 'default';
  const shutdown = args.shutdown ?? createShutdownSignal();
  let started: t.Cell.Services.Started | undefined;
  let serviceText = '';
  let closeReason: unknown = 'cell.start.finished';
  let failed = false;
  let failure: unknown;
  let session: CellSession.Handle | undefined;

  try {
    const sessionRoot = await canonicalRoot(cell.root);
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
    const render = (options: StartCellRenderOptions = {}) => {
      const renderServices = (width: number) =>
        Fmt.Services.started({
          services,
          width,
          hyperlinks: options.hyperlinks,
        });
      return formatStartServiceBody(renderServices, options.width);
    };
    serviceText = render();
    const completion = waitForStartOutcome(started, shutdown);
    if (shutdown.reason === undefined) args.onReady?.({ text: serviceText, render });

    const outcome = await completion;

    if (outcome.kind === 'shutdown') {
      if (Is.str(outcome.reason)) {
        closeReason = outcome.reason;
      } else {
        failed = true;
        failure = outcome.reason.cause;
        closeReason = failure;
      }
    } else if (!outcome.ok) {
      failed = true;
      failure = outcome.cause;
      closeReason = failure;
    }
  } catch (cause) {
    const reason = shutdown.reason;
    if (reason === undefined) {
      shutdown.seal();
      failed = true;
      failure = cause;
      closeReason = cause;
    } else if (Is.str(reason)) {
      closeReason = reason;
    } else {
      failed = true;
      failure = reason.cause;
      closeReason = failure;
    }
  }

  const cleanup = await cleanupStart(started, shutdown, session, closeReason);

  if (failed) {
    throw cleanup.ok
      ? failure
      : mergeFailures(failure, cleanup.cause, 'Cell start failed and cleanup also failed.');
  }
  if (!cleanup.ok) throw cleanup.cause;

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

type StartOutcome =
  | { readonly kind: 'shutdown'; readonly reason: ShutdownReason }
  | { readonly kind: 'services'; readonly ok: true }
  | { readonly kind: 'services'; readonly ok: false; readonly cause: unknown };

type CleanupResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly cause: unknown };

/** Resolves the first shutdown or service outcome admitted by the shared terminal latch. */
function waitForStartOutcome(
  started: t.Cell.Services.Started,
  shutdown: ShutdownSignal,
): Promise<StartOutcome> {
  return new Promise<StartOutcome>((resolve) => {
    void shutdown.done.then((reason) => resolve({ kind: 'shutdown', reason }));
    void Cell.Services.wait(started).then(
      () => {
        if (shutdown.seal()) resolve({ kind: 'services', ok: true });
      },
      (cause) => {
        if (shutdown.seal()) resolve({ kind: 'services', ok: false, cause });
      },
    );
  });
}

async function cleanupStart(
  started: t.Cell.Services.Started | undefined,
  shutdown: ShutdownSignal,
  session: CellSession.Handle | undefined,
  reason: unknown,
): Promise<CleanupResult> {
  let failed = false;
  let failure: unknown;
  const run = async (cleanup: () => void | Promise<void>) => {
    try {
      await cleanup();
    } catch (cause) {
      if (!failed) {
        failed = true;
        failure = cause;
      } else {
        failure = mergeFailures(failure, cause, 'Cell start cleanup failed.');
      }
    }
  };

  await run(() => session?.stopping());
  await run(() => started?.close(reason));
  await run(() => shutdown.dispose());
  await run(() => session?.dispose());

  return failed ? { ok: false, cause: failure } : { ok: true };
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

/** Resolves descriptor identity and caller-owned package provenance without ambient discovery. */
export function resolveStartIdentity(
  descriptor: t.Cell.Descriptor,
  callerPkg?: t.Pkg,
): t.CellCli.Start.Identity | undefined {
  const pkg = realCallerPkg(callerPkg);
  const name = descriptor.name ?? pkg?.name;
  if (!name) return undefined;
  return {
    name,
    ...(pkg ? { version: pkg.version } : {}),
  };
}

export function formatStartHeader(
  identity?: t.CellCli.Start.Identity,
  width?: number,
): string {
  if (!identity) return '';
  return Cli.Fmt.Header.rows({
    title: identity.name,
    version: identity.version ?? false,
    tone: 'green',
    width,
  }).join('\n');
}

/**
 * Renders service content inside the Cell start frame's two-cell gutter.
 *
 * The renderer receives the inner width; visible rows retain two cells at each frame edge. The
 * returned body has no outer blank rows because reporters own spacing between sections.
 */
export function formatStartServiceBody(
  render: (width: number) => string,
  width?: number,
): string {
  const frameWidth = width !== undefined && (!Num.Is.finite(width) || width <= 0)
    ? 0
    : Cli.Fmt.Text.Width.fit({ width });
  const gutter = 2;
  const innerWidth = Math.max(0, frameWidth - gutter * 2);
  if (innerWidth === 0) return '';
  const text = Str.trimEdgeNewlines(render(innerWidth));
  if (!text) return '';
  const inset = ' '.repeat(gutter);
  return text.split('\n').map((row) => row ? `${inset}${row}` : row).join('\n');
}

export function formatStartResult(res: StartCellResult): string {
  const table = CliTable.create([]);
  table.push([c.gray('root'), FmtPath.display(res.root)]);
  table.push([c.gray('services'), c.white(String(res.services))]);
  if (res.mode !== 'default') table.push([c.gray('mode'), c.white(res.mode)]);
  return Str.trimEdgeNewlines(String(table));
}

export function formatStartOutput(
  res: StartCellResult,
  identity?: t.CellCli.Start.Identity,
): string {
  const header = formatStartHeader(identity);
  const summary = formatStartResult(res);
  return [header, res.serviceText, summary].filter(Boolean).join('\n\n');
}

function realCallerPkg(input?: t.Pkg): t.Pkg | undefined {
  if (!Pkg.Is.pkg(input)) return undefined;
  if (!input.name || input.name !== input.name.trim()) return undefined;
  if (!input.version || input.version !== input.version.trim()) return undefined;
  return Pkg.Is.unknown(input) ? undefined : input;
}

export function toStartResult(
  input: t.CellCli.Input,
  res: StartCellResult,
  identity?: t.CellCli.Start.Identity,
): t.CellCli.Start.Result {
  return {
    kind: 'start',
    input,
    text: formatStartOutput(res, identity),
    root: res.root,
    services: res.services,
    ...(identity ? { identity } : {}),
    ...(res.mode !== 'default' ? { mode: res.mode } : {}),
  };
}
