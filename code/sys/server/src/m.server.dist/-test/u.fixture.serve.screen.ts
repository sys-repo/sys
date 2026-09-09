import { Rx, type t } from '../../-test.ts';
import { evidence, type Fixture } from '../../-test/u.fixture.dist.ts';

export { evidence } from '../../-test/u.fixture.dist.ts';
import { DistServeScreen } from '../u.server.screen/mod.ts';

type Terminal = {
  readonly cursorRows: number;
  size(): t.Cli.Screen.Size;
  events(until?: t.UntilInput): t.Cli.Screen.Events;
  repaint(frame: string): void;
};

type ReporterOptions = {
  until?: t.UntilInput;
  schedule?: (run: () => void) => t.Cancellable;
  keyboard?: { enabled: boolean; print: boolean };
};

type TerminalOptions = {
  viewport?: t.Cli.Screen.Size;
  resizeOnSize?: t.Cli.Screen.Size;
  resizeOnSizeCall?: number;
  onSize?: (call: number) => void;
  disposed?: boolean;
  disposeError?: unknown;
  repaint?: (frame: string, count: number) => void;
};

type ScheduleOptions = {
  synchronous?: boolean;
  error?: unknown;
  cancelError?: unknown;
};

export function createReporter(
  fixture: Fixture,
  terminal: Terminal,
  options: ReporterOptions = {},
) {
  const dist = fixture.cloneDist();
  return DistServeScreen.create({
    identity: dist.pkg,
    origin: 'http://127.0.0.1:49152/' as t.StringUrl,
    dir: './dist' as t.StringDir,
    authority: { kind: 'local-unpinned', integrity: fixture.integrity },
    evidence: evidence(fixture),
    renderedAt: dist.build.time,
    terminal,
    until: options.until,
    schedule: options.schedule,
    keyboard: options.keyboard,
  });
}

export function createTerminalHarness(options: TerminalOptions = {}) {
  let viewport = { ...(options.viewport ?? { width: 80, height: 24 }) };
  let until: t.UntilInput | undefined;
  let sizeCalls = 0;
  let disposeCalls = 0;
  let unsubscribeCalls = 0;
  const repaints: string[] = [];
  const lifecycle = Rx.lifecycle();
  const resize$$ = Rx.subject<t.Cli.Screen.SizeChanged>();
  const resize$ = new Rx.Observable<t.Cli.Screen.SizeChanged>((subscriber) => {
    const subscription = resize$$.subscribe(subscriber);
    return () => {
      unsubscribeCalls += 1;
      subscription.unsubscribe();
    };
  });
  const dispose: t.Disposable['dispose'] = (reason) => {
    disposeCalls += 1;
    lifecycle.dispose(reason);
    if (options.disposeError !== undefined) throw options.disposeError;
  };
  const events: t.Cli.Screen.Events = {
    get disposed() {
      return lifecycle.disposed;
    },
    dispose$: lifecycle.dispose$,
    dispose,
    [Symbol.dispose]() {
      dispose();
    },
    $: resize$,
    resize$,
  };
  if (options.disposed) lifecycle.dispose();

  const deps: Terminal = {
    cursorRows: 1,
    size() {
      const measured = { ...viewport };
      sizeCalls += 1;
      options.onSize?.(sizeCalls);
      if (sizeCalls === (options.resizeOnSizeCall ?? 1) && options.resizeOnSize) {
        const before = viewport;
        viewport = { ...options.resizeOnSize };
        resize$$.next({
          kind: 'size:changed',
          before,
          after: { ...options.resizeOnSize },
        });
      }
      return measured;
    },
    events(input) {
      until = input;
      return events;
    },
    repaint(frame) {
      repaints.push(frame);
      options.repaint?.(frame, repaints.length);
    },
  };

  return {
    deps,
    events,
    repaints,
    resize(next: t.Cli.Screen.Size) {
      const before = viewport;
      viewport = { ...next };
      resize$$.next({ kind: 'size:changed', before, after: { ...next } });
    },
    emit(after: t.Cli.Screen.Size) {
      const before = viewport;
      viewport = { ...after };
      resize$$.next({ kind: 'size:changed', before, after });
    },
    setViewport(next: t.Cli.Screen.Size) {
      viewport = { ...next };
    },
    get until() {
      return until;
    },
    get sizeCalls() {
      return sizeCalls;
    },
    get disposeCalls() {
      return disposeCalls;
    },
    get unsubscribeCalls() {
      return unsubscribeCalls;
    },
  };
}

export function createScheduleHarness(options: ScheduleOptions = {}) {
  const tasks: { readonly run: () => void }[] = [];
  let calls = 0;
  let cancelCalls = 0;
  const schedule = (run: () => void): t.Cancellable => {
    calls += 1;
    if (options.error !== undefined) throw options.error;
    const task = { run };
    tasks.push(task);
    if (options.synchronous) run();
    return {
      cancel() {
        cancelCalls += 1;
        if (options.cancelError !== undefined) throw options.cancelError;
      },
    };
  };

  return {
    schedule,
    flush() {
      tasks.shift()?.run();
    },
    get calls() {
      return calls;
    },
    get cancelCalls() {
      return cancelCalls;
    },
  };
}
