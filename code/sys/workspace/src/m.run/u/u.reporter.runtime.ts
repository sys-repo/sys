import { Cli, type t, Time } from '../common.ts';
import { runCleanup } from './u.cleanup.ts';

type Phase = 'idle' | 'acquiring' | 'active' | 'stopped';
type ResizeSubscription = { unsubscribe(): void };

export type ParallelReporterRuntimeDeps = {
  cursorRows: number;
  size: () => t.Cli.Screen.Size;
  events: () => t.Cli.Screen.Events;
  spinner: () => t.Cli.Spinner.Instance;
  repaint: (frame: string) => void;
  schedule: (run: () => void) => t.Cancellable;
  tick: (run: () => void) => t.Cancellable;
};

export type ParallelReporterRuntimeFrameArgs = {
  viewport: t.Cli.Screen.Size;
  cursorRows: number;
};

export type ParallelReporterRuntime = {
  readonly start: () => void;
  readonly render: () => void;
  readonly viewport: () => t.Cli.Screen.Size | undefined;
  readonly stop: (persist?: boolean) => void;
};

export type ParallelReporterRuntimeArgs = {
  frame: (args: ParallelReporterRuntimeFrameArgs) => string;
  deps?: ParallelReporterRuntimeDeps;
};

const RESIZE_DELAY = 50 as t.Msecs;
const TICK_INTERVAL = 1000 as t.Msecs;

const DEFAULT_DEPS = createDefaultParallelReporterRuntimeDeps();

/** Create canonical stdout terminal and scheduling effects for one reporter session. */
export function createDefaultParallelReporterRuntimeDeps(): ParallelReporterRuntimeDeps {
  return {
    cursorRows: 1,
    size: () => Cli.Screen.size(),
    events: () => Cli.Screen.events(),
    spinner: () => Cli.Spinner.create('', { target: 'stdout' }),
    repaint: (frame) => Cli.Screen.repaint(frame),
    schedule: (run) => Time.delay(RESIZE_DELAY, run),
    tick: (run) => Time.interval(TICK_INTERVAL, run),
  };
}

/** Own one finite viewport, resize, redraw, tick, and stdout-spinner session. */
export function createParallelReporterRuntime(
  args: ParallelReporterRuntimeArgs,
): ParallelReporterRuntime {
  const deps = args.deps ?? DEFAULT_DEPS;
  let phase: Phase = 'idle';
  let viewport: t.Cli.Screen.Size = { width: 0, height: 0 };
  let hasViewport = false;
  let screenEvents: t.Cli.Screen.Events | undefined;
  let resizeSubscription: ResizeSubscription | undefined;
  let spinner: t.Cli.Spinner.Instance | undefined;
  let spinnerRunning = false;
  let lastFrame: string | undefined;
  let tick: t.Cancellable | undefined;
  let scheduleGeneration = 0;
  let acquiringSchedule: number | undefined;
  let scheduledTask: t.Cancellable | undefined;
  let pending = false;

  const installFrame = () => {
    if (phase === 'stopped' || !spinner || !hasViewport) return;
    const frame = args.frame({ viewport: { ...viewport }, cursorRows: deps.cursorRows });
    lastFrame = frame;
    spinner.text = frame;
  };

  const startSpinner = () => {
    if (!spinner || spinnerRunning) return;
    spinnerRunning = true;
    try {
      spinner.start();
    } catch (error) {
      spinnerRunning = false;
      try {
        spinner.stop();
      } catch {
        // Preserve the spinner-start failure.
      }
      throw error;
    }
  };

  const stopSpinner = () => {
    if (!spinner || !spinnerRunning) return;
    spinnerRunning = false;
    spinner.stop();
  };

  const cancelScheduled = () => {
    scheduleGeneration += 1;
    acquiringSchedule = undefined;
    const task = scheduledTask;
    scheduledTask = undefined;
    task?.cancel();
  };

  const flushPending = () => {
    if (!pending) return;
    pending = false;
    installFrame();
  };

  const schedulePending = () => {
    if (scheduledTask || acquiringSchedule !== undefined) return;
    const generation = ++scheduleGeneration;
    acquiringSchedule = generation;
    let task: t.Cancellable;
    try {
      task = deps.schedule(() => {
        if (generation !== scheduleGeneration || phase !== 'active') return;
        acquiringSchedule = undefined;
        scheduledTask = undefined;
        flushPending();
      });
    } catch (error) {
      if (generation === scheduleGeneration) acquiringSchedule = undefined;
      throw error;
    }
    if (generation === scheduleGeneration && acquiringSchedule === generation) {
      acquiringSchedule = undefined;
      scheduledTask = task;
    }
  };

  const request = () => {
    if (phase !== 'active') return;
    pending = true;
    schedulePending();
  };

  const render = () => {
    if (phase !== 'active') return;
    pending = true;
    runCleanup([cancelScheduled, flushPending]);
  };

  const cancelTick = () => {
    const current = tick;
    tick = undefined;
    current?.cancel();
  };

  const unsubscribeResize = () => {
    const current = resizeSubscription;
    resizeSubscription = undefined;
    current?.unsubscribe();
  };

  const releaseEvents = () => {
    const current = screenEvents;
    screenEvents = undefined;
    current?.dispose();
  };

  const persistFrame = () => {
    if (lastFrame !== undefined) deps.repaint(lastFrame);
  };

  const release = (persist: boolean) => {
    pending = false;
    runCleanup([
      cancelScheduled,
      cancelTick,
      unsubscribeResize,
      releaseEvents,
      stopSpinner,
      ...(persist ? [persistFrame] : []),
    ]);
  };

  const start = () => {
    if (phase !== 'idle') return;
    phase = 'acquiring';

    try {
      screenEvents = deps.events();
      if (screenEvents.disposed) {
        phase = 'stopped';
        return;
      }

      spinner = deps.spinner();
      resizeSubscription = screenEvents.resize$.subscribe((event) => {
        viewport = { ...event.after };
        hasViewport = true;
        request();
      });
      if (!hasViewport) {
        const initial = deps.size();
        if (!hasViewport) viewport = { ...initial };
        hasViewport = true;
      }

      installFrame();
      startSpinner();
      phase = 'active';
      tick = deps.tick(render);
    } catch (error) {
      phase = 'stopped';
      try {
        release(false);
      } catch {
        // Preserve the acquisition or first-render failure.
      }
      throw error;
    }
  };

  const currentViewport = () => hasViewport ? { ...viewport } : undefined;

  const stop = (persist = true) => {
    if (phase === 'stopped') return;
    phase = 'stopped';
    release(persist);
  };

  return { start, render, viewport: currentViewport, stop };
}
