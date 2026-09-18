import { Cli, Num, Str, stripAnsi, type t, Time } from '../common.ts';
import { mergeFailures } from './u.failure.ts';
import { formatStartHeader, type StartCellReady, startServicesText } from './u.start.ts';

type Mode = t.CellCli.Start.ReporterMode;
type ResolvedMode = Exclude<Mode, 'auto'>;
type ScreenSize = t.Cli.Screen.Size;
type Spinner = t.Cli.Spinner.Instance;

type StartReporterInstance = {
  readonly mode: ResolvedMode;
  open(): void;
  starting(serviceCount: number): void;
  ready(input: StartCellReady): void;
  complete(summary: string): void;
  redraw(): void;
  dispose(): Promise<void>;
};

type StartReporterControls = {
  until: PromiseLike<unknown>;
  /** Publish an admitted Ctrl+C keyboard interrupt. */
  onInterrupt: () => void;
  /** Publish a presentation failure; true means this failure became terminal. */
  onFailure: (cause: unknown) => boolean;
};

type StartReporterDeps = {
  isInteractive: () => boolean;
  isTerminal: () => boolean;
  print: (text: string) => void;
  header: (width?: number) => string;
  startText: (serviceCount: number, startedAt?: t.UnixTimestamp) => string;
  size: () => ScreenSize;
  observeResize: (handler: (size: ScreenSize) => void) => () => void;
  repaint: (frame: string) => void;
  spinner: (target?: t.Cli.Spinner.OutputTarget) => Spinner;
  interval: (run: () => void) => () => void;
  bindKeyboard: typeof Cli.Keyboard.bind;
  shutdownKeyboard: typeof Cli.Keyboard.shutdown;
};

/**
 * Owns terminal presentation for the Cell start command.
 *
 * Resolves capability policy once, then delegates every terminal effect to exactly one reporter.
 * Raw output remains append-only; the ready screen owns resize, redraw, keyboard, and repaint.
 */
export const StartReporter = Object.freeze(
  {
    resolve,
    create,
  } as const,
);

/**
 * Helpers:
 */
const DEFAULT_DEPS: StartReporterDeps = {
  isInteractive: () => Cli.Is.interactive(),
  isTerminal: () => Cli.Is.terminal('stdout'),
  print: (text) => console.info(text),
  header: (width) => formatStartHeader(undefined, width),
  startText: (serviceCount, startedAt) =>
    Cli.Fmt.spinnerText(startServicesText(serviceCount, startedAt)),
  size: () => Cli.Screen.size(),
  observeResize(handler) {
    const events = Cli.Screen.events();
    const subscription = events.resize$.subscribe((event) => handler(event.after));
    return () => {
      subscription.unsubscribe();
      events.dispose();
    };
  },
  repaint: (frame) => Cli.Screen.repaint(frame),
  spinner: (target) => Cli.Spinner.create('', target ? { target } : undefined),
  interval(run) {
    const id = globalThis.setInterval(run, 1000);
    return () => globalThis.clearInterval(id);
  },
  bindKeyboard: Cli.Keyboard.bind,
  shutdownKeyboard: Cli.Keyboard.shutdown,
};

function resolve(mode: Mode, options: Pick<StartReporterDeps, 'isInteractive'>): ResolvedMode {
  if (mode === 'raw') return 'raw';
  const interactive = options.isInteractive();
  if (mode === 'screen' && !interactive) {
    throw new Error("Cell start reporter 'screen' requires an interactive terminal.");
  }
  return interactive ? 'screen' : 'raw';
}

function create(
  mode: Mode,
  overrides: Partial<StartReporterDeps> = {},
  controls?: StartReporterControls,
): StartReporterInstance {
  const deps: StartReporterDeps = { ...DEFAULT_DEPS, ...overrides };
  const resolved = resolve(mode, deps);
  const hyperlinks = deps.isTerminal();
  return resolved === 'screen'
    ? createScreen(deps, hyperlinks, controls)
    : createRaw(deps, hyperlinks, controls);
}

function createRaw(
  deps: StartReporterDeps,
  hyperlinks: boolean,
  controls?: StartReporterControls,
): StartReporterInstance {
  type Phase = 'idle' | 'open' | 'ready' | 'complete' | 'disposed';

  const disposed = Promise.resolve();
  let phase: Phase = 'idle';
  let hasSection = false;

  const printSection = (text: string) => {
    if (!text) return;
    deps.print(hasSection ? `\n${text}` : text);
    hasSection = true;
  };

  return {
    mode: 'raw',
    open() {
      if (phase !== 'idle') return;
      phase = 'open';
      printSection(deps.header());
    },
    starting() {},
    ready(input) {
      if (phase === 'disposed' || phase === 'complete') return;
      phase = 'ready';
      printSection(hyperlinks ? input.render({ hyperlinks: true }) : input.text);
    },
    complete(summary) {
      if (phase !== 'ready') return;
      phase = 'complete';
      try {
        printSection(summary);
      } catch (cause) {
        if (controls?.onFailure(cause) ?? true) throw cause;
      }
    },
    redraw() {},
    dispose() {
      phase = 'disposed';
      return disposed;
    },
  };
}

function createScreen(
  deps: StartReporterDeps,
  hyperlinks: boolean,
  controls?: StartReporterControls,
): StartReporterInstance {
  type Phase = 'idle' | 'open' | 'starting' | 'ready' | 'complete' | 'failed' | 'disposed';

  let phase: Phase = 'idle';
  let viewport: ScreenSize = { width: 0, height: 0 };
  let releaseResize: (() => void) | undefined;
  let spinner: Spinner | undefined;
  let spinnerRunning = false;
  let cancelInterval: (() => void) | undefined;
  let renderBody: StartCellReady['render'] | undefined;
  let summary = '';
  let resizeRevision = 0;
  let painting = false;
  let paintPending = false;
  let measurePending = false;
  let failureSettled = false;
  let reportedFailure: unknown;
  let keyboard: ReturnType<StartReporterDeps['bindKeyboard']>;
  let disposePromise: Promise<void> | undefined;

  const headerRows = () => rowsOf(deps.header(viewport.width));
  const hasSpinnerRow = () => viewport.width > 0 && viewport.height > headerRows().length;

  const frame = () => {
    if (viewport.width === 0 || viewport.height === 0) return '';
    const header = headerRows().slice(0, viewport.height);
    const capacity = Math.max(0, viewport.height - header.length);
    const body = phase === 'ready' || phase === 'complete' || phase === 'failed'
      ? rowsOf(Str.trimEdgeNewlines(renderBody?.({ width: viewport.width, hyperlinks }) ?? ''))
      : [];
    const summaryRows = phase === 'complete' ? rowsOf(Str.trimEdgeNewlines(summary)) : [];

    // Completion facts outrank service-body rows; content outranks decorative spacing.
    const visibleSummary = summaryRows.slice(0, capacity);
    const bodyBudget = Math.max(0, capacity - visibleSummary.length);
    const visibleBody = body.slice(0, bodyBudget);
    let spacingBudget = Math.max(0, bodyBudget - visibleBody.length);

    const separateBodySummary = visibleBody.length > 0 &&
      visibleSummary.length > 0 &&
      spacingBudget > 0;
    if (separateBodySummary) spacingBudget -= 1;

    const hasVisibleContent = visibleBody.length > 0 || visibleSummary.length > 0;
    const separateHeader = header.length > 0 && hasVisibleContent && spacingBudget > 0;
    const rows = [
      ...header,
      ...(separateHeader ? [''] : []),
      ...visibleBody,
      ...(separateBodySummary ? [''] : []),
      ...visibleSummary,
    ];
    return rows.map((row) => fitRow(row, viewport.width)).join('\n');
  };

  const repaint = (remeasure = false) => {
    paintPending = true;
    if (remeasure) measurePending = true;
    if (painting) return;

    painting = true;
    try {
      while (paintPending || measurePending) {
        if (phase === 'failed' || phase === 'disposed') {
          paintPending = false;
          measurePending = false;
          break;
        }
        if (measurePending) {
          measurePending = false;
          const revision = resizeRevision;
          const measured = normalizeSize(deps.size());
          if (resizeRevision === revision) viewport = measured;
        }

        // State published during frame construction or repaint requests one newest-state follow-up.
        paintPending = false;
        deps.repaint(frame());
      }
    } catch (cause) {
      paintPending = false;
      measurePending = false;
      throw cause;
    } finally {
      painting = false;
    }
  };

  const pauseSpinner = () => {
    if (!spinnerRunning) return;
    spinnerRunning = false;
    spinner?.stop();
  };

  const startSpinner = () => {
    if (phase !== 'starting' || spinnerRunning || !hasSpinnerRow()) return;
    spinnerRunning = true;
    spinner?.start();
  };

  const releaseSpinner = () => {
    const cancel = cancelInterval;
    cancelInterval = undefined;
    try {
      runCleanup([() => cancel?.(), pauseSpinner]);
    } finally {
      spinner = undefined;
    }
  };

  const fail = (cause: unknown) => {
    if (failureSettled || phase === 'disposed') return;
    failureSettled = true;
    reportedFailure = cause;
    if (controls?.onFailure(cause) ?? true) phase = 'failed';
  };

  const redraw = () => {
    if (phase !== 'ready') return;
    try {
      repaint(true);
    } catch (cause) {
      fail(cause);
    }
  };

  const acquireKeyboard = () => {
    if (!controls || keyboard) return;
    const owner = deps.bindKeyboard({
      quitKeys: 'interrupt-only',
      until: controls.until,
      onQuit: controls.onInterrupt,
      onKey(event) {
        if (Cli.Keyboard.Is.redraw(event)) redraw();
      },
    });
    keyboard = owner;
    if (!owner) return;

    void owner.finished.then(
      () => undefined,
      (cause) => fail(cause),
    );
  };

  const onResize = (size: ScreenSize) => {
    if (phase === 'disposed' || phase === 'failed') return;
    viewport = normalizeSize(size);
    resizeRevision += 1;
    if (phase === 'idle') return;
    try {
      pauseSpinner();
      repaint();
      startSpinner();
    } catch (cause) {
      fail(cause);
    }
  };

  return {
    mode: 'screen',
    open() {
      if (phase !== 'idle') return;
      let observed = false;
      try {
        releaseResize = deps.observeResize((size) => {
          observed = true;
          onResize(size);
        });
        if (!observed) viewport = normalizeSize(deps.size());
        phase = 'open';
        repaint();
      } catch (error) {
        let failure: unknown = error;
        try {
          releaseResize?.();
        } catch (cleanup) {
          failure = mergeFailures(
            error,
            cleanup,
            'Cell start presentation acquisition and cleanup failed.',
          );
        }
        releaseResize = undefined;
        phase = 'disposed';
        throw failure;
      }
    },
    starting(serviceCount) {
      if (phase !== 'open') return;
      phase = 'starting';
      const startedAt = Time.now.timestamp;
      spinner = deps.spinner('stdout');
      const update = () => {
        if (spinner) spinner.text = deps.startText(serviceCount, startedAt);
      };
      update();
      startSpinner();
      cancelInterval = deps.interval(update);
    },
    ready(input) {
      if (phase !== 'starting' && phase !== 'open') return;
      releaseSpinner();
      renderBody = input.render;
      phase = 'ready';
      acquireKeyboard();
      repaint();
    },
    complete(text) {
      if (phase !== 'ready') return;
      releaseSpinner();
      summary = text;
      phase = 'complete';
      try {
        repaint();
      } catch (cause) {
        fail(cause);
      }
    },
    redraw,
    dispose() {
      if (disposePromise) return disposePromise;
      phase = 'disposed';
      const releaseScreen = releaseResize;
      const ownedKeyboard = keyboard;
      releaseResize = undefined;
      keyboard = undefined;
      disposePromise = (async () => {
        await Promise.resolve();
        let failed = false;
        let cleanupFailure: unknown;
        try {
          runCleanup([releaseSpinner, () => releaseScreen?.()]);
        } catch (cause) {
          failed = true;
          cleanupFailure = cause;
        }
        if (ownedKeyboard) {
          try {
            await deps.shutdownKeyboard(ownedKeyboard);
          } catch (cause) {
            if (cause === reportedFailure) {
              // The lifecycle already owns this terminal failure.
            } else if (!failed) {
              failed = true;
              cleanupFailure = cause;
            } else {
              cleanupFailure = mergeFailures(
                cleanupFailure,
                cause,
                'Cell start presentation cleanup failed.',
              );
            }
          }
        }
        if (failed) throw cleanupFailure;
      })();
      return disposePromise;
    },
  };
}

function rowsOf(text: string): string[] {
  return text ? text.split('\n') : [];
}

function fitRow(row: string, width: number): string {
  if (Cli.Fmt.Text.Width.measure(row) <= width) return row;
  return Cli.Fmt.Text.ellipsize(stripAnsi(row), width, {
    render: ({ head, ellipsis, tail }) => `${head}${Cli.Fmt.omission(ellipsis)}${tail}`,
  });
}

function normalizeSize(size: ScreenSize): ScreenSize {
  const dimension = (value: number) => Num.Is.finite(value) ? Math.max(0, Math.floor(value)) : 0;
  return { width: dimension(size.width), height: dimension(size.height) };
}

function runCleanup(actions: readonly (() => void)[]): void {
  let failed = false;
  let failure: unknown;
  for (const action of actions) {
    try {
      action();
    } catch (error) {
      if (!failed) {
        failed = true;
        failure = error;
      } else {
        failure = mergeFailures(failure, error, 'Cell start presentation cleanup failed.');
      }
    }
  }
  if (failed) throw failure;
}
