import { Cli, Num, type t, Time } from './common.ts';
import { DistServeScreenLayout } from './u.layout.ts';

type FailureChannel = {
  readonly promise: Promise<never>;
  reject(cause: unknown): void;
};

type ResizeSubscription = { unsubscribe(): void };

const RESIZE_REPAINT_DELAY = 50 as t.Msecs;

const DISPOSED_REPORTER = Object.freeze(
  {
    failure: new Promise<never>(() => {}),
    redraw() {},
    dispose() {},
  } satisfies t.DistServeScreen.Reporter,
);

const DEFAULT_TERMINAL = Object.freeze(
  {
    cursorRows: 1,
    size: () => Cli.Screen.size(),
    events: (until?: t.UntilInput) => Cli.Screen.events(until),
    repaint: (frame: string) => Cli.Screen.repaint(frame),
  } satisfies t.DistServeScreen.Terminal,
);

/** Effectful owner of one responsive Dist serve-screen lifecycle. */
export const DistServeScreenRuntime = {
  create(args: t.DistServeScreen.CreateArgs): t.DistServeScreen.Reporter {
    const terminal = { ...DEFAULT_TERMINAL, ...args.terminal };
    const schedule = args.schedule ??
      ((run: () => void) => Time.delay(RESIZE_REPAINT_DELAY, run));
    const events = terminal.events(args.until);
    if (events.disposed) return DISPOSED_REPORTER;

    const failed = failureChannel();
    let disposed = false;
    let acquired = false;
    let observed = false;
    let pending = false;
    let redrawing = false;
    let resizeRevision = 0;
    let scheduleGeneration = 0;
    let acquiringSchedule: number | undefined;
    let scheduledTask: t.Cancellable | undefined;
    let viewport: t.Cli.Screen.Size = { width: 0, height: 0 };
    let subscription: ResizeSubscription | undefined;

    const repaint = () => {
      terminal.repaint(
        DistServeScreenLayout.toString({
          identity: args.identity,
          origin: args.origin,
          dir: args.dir,
          manifestHref: args.manifestHref,
          authority: args.authority,
          evidence: args.evidence,
          renderedAt: args.renderedAt,
          viewport,
          cursorRows: terminal.cursorRows,
          keyboard: frameKeyboard(args.keyboard),
        }),
      );
    };

    const cancelScheduled = () => {
      scheduleGeneration += 1;
      acquiringSchedule = undefined;
      const task = scheduledTask;
      scheduledTask = undefined;
      task?.cancel();
    };

    const release = () => {
      if (disposed) return;
      disposed = true;
      pending = false;
      const current = subscription;
      subscription = undefined;
      cleanup([
        cancelScheduled,
        () => current?.unsubscribe(),
        () => events.dispose(),
      ]);
    };

    const fail = (cause: unknown) => {
      if (disposed) return;
      try {
        release();
      } catch {
        // Preserve the original presentation failure.
      }
      failed.reject(cause);
    };

    const flushPending = (generation: number) => {
      if (generation !== scheduleGeneration || disposed) return;
      acquiringSchedule = undefined;
      scheduledTask = undefined;
      if (redrawing) return;
      if (events.disposed) {
        pending = false;
        return;
      }
      if (!pending) return;
      pending = false;
      try {
        repaint();
      } catch (error) {
        fail(error);
      }
    };

    const schedulePending = () => {
      if (scheduledTask || acquiringSchedule !== undefined) return;
      const generation = ++scheduleGeneration;
      acquiringSchedule = generation;
      let task: t.Cancellable;
      try {
        task = schedule(() => flushPending(generation));
      } catch (error) {
        if (generation === scheduleGeneration) acquiringSchedule = undefined;
        throw error;
      }
      if (generation === scheduleGeneration && acquiringSchedule === generation) {
        acquiringSchedule = undefined;
        scheduledTask = task;
      }
    };

    const requestRepaint = () => {
      pending = true;
      schedulePending();
    };

    const redraw = () => {
      if (disposed || !acquired || redrawing || events.disposed) return;
      redrawing = true;
      const revision = resizeRevision;
      try {
        const measured = normalizeViewport(terminal.size());
        if (disposed || !acquired || events.disposed) return;
        if (resizeRevision === revision) viewport = measured;
        pending = false;
        cancelScheduled();
        if (disposed || !acquired || events.disposed) return;
        repaint();
      } catch (error) {
        fail(error);
      } finally {
        redrawing = false;
      }
    };

    try {
      subscription = events.resize$.subscribe((event) => {
        if (disposed) return;
        viewport = normalizeViewport(event.after);
        observed = true;
        resizeRevision += 1;
        if (!acquired || redrawing) return;
        try {
          requestRepaint();
        } catch (error) {
          fail(error);
        }
      });
      if (!observed) {
        const initial = normalizeViewport(terminal.size());
        if (!observed) {
          viewport = initial;
          observed = true;
        }
      }
      repaint();
      acquired = true;
    } catch (error) {
      try {
        release();
      } catch {
        // Preserve the acquisition or initial-render failure.
      }
      throw error;
    }

    return { failure: failed.promise, redraw, dispose: release };
  },
} as const;

function frameKeyboard(
  input: t.DistServeScreen.Keyboard | undefined,
): t.DistServeScreen.Keyboard {
  const keyboard = {
    enabled: input?.enabled ?? false,
    print: input?.print ?? false,
  };
  return input?.navigation ? { ...keyboard, navigation: input.navigation } : keyboard;
}

function failureChannel(): FailureChannel {
  let reject: (cause: unknown) => void = () => {};
  const promise = new Promise<never>((_, rejectPromise) => {
    reject = rejectPromise;
  });
  return { promise, reject };
}

function normalizeViewport(input: t.Cli.Screen.Size): t.Cli.Screen.Size {
  const dimension = (value: number) => Num.Is.finite(value) ? Math.max(0, Math.floor(value)) : 0;
  return {
    width: dimension(input.width),
    height: dimension(input.height),
  };
}

function cleanup(actions: readonly (() => void)[]): void {
  let hasFailure = false;
  let failure: unknown;
  for (const action of actions) {
    try {
      action();
    } catch (error) {
      if (hasFailure) continue;
      failure = error;
      hasFailure = true;
    }
  }
  if (hasFailure) throw failure;
}
