import { Cli, Num, Str, stripAnsi, type t, Time } from '../common.ts';
import { formatStartHeader, startServicesText } from './u.start.ts';

type Mode = t.CellCli.Start.ReporterMode;
type ResolvedMode = Exclude<Mode, 'auto'>;
type ScreenSize = t.Cli.Screen.Size;
type Spinner = t.Cli.Spinner.Instance;

type StartReporterReady = {
  readonly text: string;
  readonly render: (width?: number) => string;
};

type StartReporterInstance = {
  readonly mode: ResolvedMode;
  open(): void;
  starting(serviceCount: number): void;
  ready(input: StartReporterReady): void;
  complete(summary: string): void;
  dispose(): void;
};

type StartReporterDeps = {
  readonly isInteractive: () => boolean;
  readonly print: (text: string) => void;
  readonly header: (width?: number) => string;
  readonly startText: (serviceCount: number, startedAt?: t.UnixTimestamp) => string;
  readonly size: () => ScreenSize;
  readonly observeResize: (handler: (size: ScreenSize) => void) => () => void;
  readonly repaint: (frame: string) => void;
  readonly spinner: (target?: t.Cli.Spinner.OutputTarget) => Spinner;
  readonly interval: (run: () => void) => () => void;
};

/**
 * Owns terminal presentation for the Cell start command.
 *
 * Resolves capability policy once, then delegates every terminal effect to exactly one reporter.
 */
export const StartReporter = {
  resolve,
  create,
} as const;

/**
 * Helpers:
 */
const DEFAULT_DEPS: StartReporterDeps = {
  isInteractive: () => Cli.Is.interactive(),
  print: (text) => console.info(text),
  header: (width) => formatStartHeader(width),
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
): StartReporterInstance {
  const deps: StartReporterDeps = { ...DEFAULT_DEPS, ...overrides };
  const resolved = resolve(mode, deps);
  return resolved === 'screen' ? createScreen(deps) : createRaw(deps);
}

function createRaw(deps: StartReporterDeps): StartReporterInstance {
  type Phase = 'idle' | 'open' | 'ready' | 'complete' | 'disposed';

  let phase: Phase = 'idle';
  let hasBody = false;

  return {
    mode: 'raw',
    open() {
      if (phase !== 'idle') return;
      phase = 'open';
      deps.print(deps.header());
    },
    starting() {},
    ready(input) {
      if (phase === 'disposed' || phase === 'complete') return;
      phase = 'ready';
      hasBody = Boolean(input.text);
      if (hasBody) deps.print(input.text);
    },
    complete(summary) {
      if (phase === 'disposed' || phase === 'complete') return;
      phase = 'complete';
      deps.print(hasBody ? summary : `\n${summary}`);
    },
    dispose() {
      phase = 'disposed';
    },
  };
}

function createScreen(deps: StartReporterDeps): StartReporterInstance {
  type Phase = 'idle' | 'open' | 'starting' | 'ready' | 'complete' | 'disposed';

  let phase: Phase = 'idle';
  let viewport: ScreenSize = { width: 0, height: 0 };
  let releaseResize: (() => void) | undefined;
  let spinner: Spinner | undefined;
  let spinnerRunning = false;
  let cancelInterval: (() => void) | undefined;
  let renderBody: ((width?: number) => string) | undefined;
  let summary = '';

  const headerRows = () => rowsOf(deps.header(viewport.width));
  const hasSpinnerRow = () => viewport.width > 0 && viewport.height > headerRows().length;

  const frame = () => {
    if (viewport.width === 0 || viewport.height === 0) return '';
    const header = headerRows().slice(0, viewport.height);
    const capacity = Math.max(0, viewport.height - header.length);
    const body = phase === 'ready' || phase === 'complete'
      ? rowsOf(Str.trimEdgeNewlines(renderBody?.(viewport.width) ?? ''))
      : [];
    const summaryRows = phase === 'complete' ? rowsOf(Str.trimEdgeNewlines(summary)) : [];
    // Completion facts outrank service-body rows when viewport height is constrained.
    const summaryBudget = Math.min(capacity, sectionRowCount(summaryRows));
    const visibleSummary = fitSection(summaryRows, summaryBudget);
    const bodyBudget = Math.max(0, capacity - visibleSummary.length);
    const visibleBody = fitSection(body, bodyBudget);
    const rows = [...header, ...visibleBody, ...visibleSummary];
    return rows.map((row) => fitRow(row, viewport.width)).join('\n');
  };

  const repaint = () => deps.repaint(frame());

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

  const onResize = (size: ScreenSize) => {
    if (phase === 'disposed') return;
    viewport = normalizeSize(size);
    if (phase === 'idle') return;
    pauseSpinner();
    repaint();
    startSpinner();
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
        try {
          releaseResize?.();
        } catch {
          // Preserve the acquisition failure.
        }
        releaseResize = undefined;
        phase = 'disposed';
        throw error;
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
      repaint();
    },
    complete(text) {
      if (phase !== 'ready') return;
      releaseSpinner();
      summary = text;
      phase = 'complete';
      repaint();
    },
    dispose() {
      if (phase === 'disposed') return;
      phase = 'disposed';
      const releaseScreen = releaseResize;
      releaseResize = undefined;
      runCleanup([releaseSpinner, () => releaseScreen?.()]);
    },
  };
}

function rowsOf(text: string): string[] {
  return text ? text.split('\n') : [];
}

function sectionRowCount(rows: readonly string[]): number {
  return rows.length === 0 ? 0 : rows.length + 1;
}

function fitSection(rows: readonly string[], capacity: number): string[] {
  if (rows.length === 0 || capacity <= 0) return [];
  if (capacity === 1) return [rows[0]];
  return ['', ...rows.slice(0, capacity - 1)];
}

function fitRow(row: string, width: number): string {
  if (Cli.Fmt.Text.Width.measure(row) <= width) return row;
  return Cli.Fmt.Text.ellipsize(stripAnsi(row), width);
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
      if (failed) continue;
      failed = true;
      failure = error;
    }
  }
  if (failed) throw failure;
}
