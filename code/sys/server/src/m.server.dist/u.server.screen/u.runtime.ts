import { Cli, Num, type t, Time } from './common.ts';
import { type DistServeScreenFrameArgs, DistServeScreenLayout } from './u.layout.ts';

type FailureChannel = {
  readonly promise: Promise<never>;
  reject(cause: unknown): void;
};

type ResizeSubscription = { unsubscribe(): void };
type Schedule = (run: () => void) => t.Cancellable;

type Terminal = {
  readonly cursorRows: number;
  size(): t.Cli.Screen.Size;
  events(until?: t.UntilInput): t.Cli.Screen.Events;
  repaint(frame: string): void;
};

export type DistServeScreenReporter = {
  readonly failure: Promise<never>;
  readonly dispose: () => void;
};

export type DistServeScreenCreateArgs =
  & Pick<
    DistServeScreenFrameArgs,
    'origin' | 'dir' | 'manifestHref' | 'authority' | 'evidence' | 'renderedAt'
  >
  & {
    readonly identity?: DistServeScreenFrameArgs['identity'];
    readonly keyboard?: {
      readonly enabled: boolean;
      readonly print: boolean;
    };
    readonly until?: t.UntilInput;
    readonly terminal?: Partial<Terminal>;
    readonly schedule?: Schedule;
  };

const RESIZE_REPAINT_DELAY = 50 as t.Msecs;

const DISPOSED_REPORTER = Object.freeze(
  {
    failure: new Promise<never>(() => {}),
    dispose() {},
  } satisfies DistServeScreenReporter,
);

const DEFAULT_TERMINAL = Object.freeze(
  {
    cursorRows: 1,
    size: () => Cli.Screen.size(),
    events: (until?: t.UntilInput) => Cli.Screen.events(until),
    repaint: (frame: string) => Cli.Screen.repaint(frame),
  } satisfies Terminal,
);

/** Effectful owner of one responsive Dist serve-screen lifecycle. */
export const DistServeScreenRuntime = {
  create(args: DistServeScreenCreateArgs): DistServeScreenReporter {
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
          keyboard: {
            enabled: args.keyboard?.enabled ?? false,
            print: args.keyboard?.print ?? false,
          },
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

    try {
      subscription = events.resize$.subscribe((event) => {
        if (disposed) return;
        viewport = normalizeViewport(event.after);
        observed = true;
        if (!acquired) return;
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

    return { failure: failed.promise, dispose: release };
  },
} as const;

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
