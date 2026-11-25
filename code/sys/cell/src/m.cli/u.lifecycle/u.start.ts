import { Cell } from '../../m.cell/mod.ts';
import { serviceStatusOf } from '../../m.cell/u.services/u.status.ts';
import { c, Cli, CliTable, Is, Num, Pkg, Str, type t, Time } from '../common.ts';
import { smallCountText } from '../u.fmt/u.count.ts';
import { elapsedSuffix } from '../u.fmt/u.elapsed.ts';
import { Fmt } from '../u.fmt/u.mod.ts';
import { FmtPath } from '../u.fmt/u.path.ts';
import { canonicalRoot } from '../u/u.root.ts';
import { CellSession } from '../u/u.session.ts';
import { type BrowserTargets, resolveBrowserTargets } from './u.browser.targets.ts';
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
  /** Physical body row limit, optionally chosen after fitting at the current width. */
  maxRows?: t.Cli.Fmt.Service.Options['maxRows'];
  /** Whether final eligible service labels should use OSC 8 hyperlinks. */
  hyperlinks?: boolean;
  /** Show destination markers on the interactive ready screen only. */
  urlMarkers?: boolean;
};

/** Service-body presentation supplied when startup reaches ready. */
export type StartCellReady = {
  /** Stable append-only rendering at the ambient output width. */
  readonly text: string;
  /** Re-renders the same body for an explicit presentation context. */
  readonly render: (options?: StartCellRenderOptions) => string;
  /** Browser destinations and selection diagnostics from the same ready snapshot. */
  readonly browser: BrowserTargets;
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
  deps: { createSession?: typeof CellSession.create } = {},
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
    session = await (deps.createSession ?? CellSession.create)({
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
    // Own service rejection before publishing readiness yields to filesystem I/O. Preserve the
    // exact cause, but defer terminal arbitration so ready-boundary presentation keeps priority.
    const servicesDone: Promise<ServiceOutcome> = Cell.Services.wait(started).then(
      () => ({ kind: 'services', ok: true }),
      (cause: unknown) => ({ kind: 'services', ok: false, cause }),
    );
    await session.ready();

    const captured = started.services.map((item) => {
      const snapshot = serviceStatusOf(item);
      const display = Fmt.Services.capture(snapshot, item.handle);
      const source = {
        service: snapshot.service.name,
        pathnames: snapshot.selection.descriptor.browser,
        urls: snapshot.owner?.urls,
      };
      return { display, source };
    });
    const selection = resolveBrowserTargets(captured.map(({ source }) => source));
    const services = captured.map(({ display }) => display);
    const ready = startCellReady(services, Cli.Is.terminal('stdout'), selection);
    serviceText = ready.text;
    const completion = waitForStartOutcome(servicesDone, shutdown);
    if (shutdown.reason === undefined) args.onReady?.(ready);

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

type ServiceOutcome = Extract<StartOutcome, { kind: 'services' }>;

type CleanupResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly cause: unknown };

/** Resolves the first shutdown or service outcome admitted by the shared terminal latch. */
function waitForStartOutcome(
  services: Promise<ServiceOutcome>,
  shutdown: ShutdownSignal,
): Promise<StartOutcome> {
  return new Promise<StartOutcome>((resolve) => {
    void shutdown.done.then((reason) => resolve({ kind: 'shutdown', reason }));
    void services.then((outcome) => {
      if (shutdown.seal()) resolve(outcome);
    });
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

type StartPresentation = {
  readonly title: t.CellCli.Start.Identity['name'];
  readonly pkg?: Readonly<t.Pkg>;
  readonly versionLink?: 'jsr';
};

/** Resolves descriptor identity and caller-owned package provenance without ambient discovery. */
export function resolveStartPresentation(
  descriptor: t.Cell.Descriptor,
  input: Pick<t.CellCli.Input, 'pkg' | 'versionLink'>,
): StartPresentation | undefined {
  const pkg = snapshotCallerPkg(input.pkg);
  const title = descriptor.name ?? pkg?.name;
  if (!title) return undefined;
  return { title, pkg, versionLink: input.versionLink };
}

export function formatStartHeader(
  presentation?: StartPresentation,
  width?: number,
  link = false,
): string {
  if (!presentation) return '';
  const { title, pkg, versionLink } = presentation;
  const version = pkg ? Cli.Fmt.jsrVersion(pkg, { link: link && versionLink === 'jsr' }) : false;
  return Cli.Fmt.Header.rows({
    title,
    version,
    tone: 'green',
    width,
  }).join('\n');
}

/** Keep result text unabridged; only an interactive repaint supplies a row limit. */
export function startCellReady(
  services: readonly t.Cli.Fmt.Service.Input[],
  terminal: boolean,
  selection?: ReturnType<typeof resolveBrowserTargets>,
): StartCellReady {
  const browser = selection?.browser ?? { targets: [], diagnostics: [] };
  const marked = selection?.selected.size
    ? services.map((service): t.Cli.Fmt.Service.Input => {
      const hrefs = selection.selected.get(service.name);
      if (!hrefs) return service;
      return { ...service, urlDisplay: { ...service.urlDisplay, mark: (href) => hrefs.has(href) } };
    })
    : services;

  const render: StartCellReady['render'] = (options = {}) => {
    const { width: frameWidth, maxRows, hyperlinks, urlMarkers } = options;
    const body = (width?: number) => {
      return Fmt.Services.started({
        services: urlMarkers ? marked : services,
        width,
        maxRows,
        hyperlinks,
        terminal: false,
      });
    };
    return formatStartServiceBody(body, frameWidth, terminal);
  };
  return { text: render(), render, browser };
}

/**
 * Renders service content inside the Cell start frame's two-cell gutter.
 *
 * The renderer receives the inner width, or undefined for unbounded non-terminal output.
 * Add no outer blank rows; preserve authored rows and leave section spacing to the reporter.
 */
export function formatStartServiceBody(
  render: (width: number | undefined) => string,
  width?: number,
  terminal = Cli.Is.terminal('stdout'),
): string {
  const gutter = 2;
  let innerWidth: number | undefined;
  if (width !== undefined || terminal) {
    const frameWidth = width ?? Cli.Screen.size().width;
    if (!Num.Is.finite(frameWidth)) return '';
    innerWidth = Math.max(0, Math.floor(frameWidth) - gutter * 2);
    if (innerWidth === 0) return '';
  }
  const text = render(innerWidth);
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

function formatStartOutput(res: StartCellResult, presentation?: StartPresentation): string {
  const header = formatStartHeader(presentation);
  const summary = formatStartResult(res);
  return [header, res.serviceText, summary].filter(Boolean).join('\n\n');
}

function snapshotCallerPkg(input?: t.Pkg): Readonly<t.Pkg> | undefined {
  if (!Pkg.Is.pkg(input)) return undefined;
  const { name, version } = input;
  if (!name || name !== name.trim()) return undefined;
  if (!version || version !== version.trim()) return undefined;
  const pkg = { name, version };
  return Pkg.Is.unknown(pkg) ? undefined : pkg;
}

export function toStartResult(
  input: t.CellCli.Input,
  res: StartCellResult,
  presentation?: StartPresentation,
): t.CellCli.Start.Result {
  const identity = presentation && {
    name: presentation.title,
    ...(presentation.pkg ? { version: presentation.pkg.version } : {}),
  };
  return {
    kind: 'start',
    input,
    text: formatStartOutput(res, presentation),
    root: res.root,
    services: res.services,
    ...(identity ? { identity } : {}),
    ...(res.mode !== 'default' ? { mode: res.mode } : {}),
  };
}
