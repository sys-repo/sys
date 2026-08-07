import { Cli, type t, Time } from '../common.ts';
import { DevScreenLayout } from './u.dev.screen.layout.ts';

type Phase = t.ViteDev.Screen.Runtime.Phase | 'disposed';
type Invalidation = 'content' | 'layout';
type Cleanup = () => void;
type ResizeSubscription = { unsubscribe(): void };

const REPAINT_DELAY = 50 as t.Msecs;

const DISPOSED_REPORTER = Object.freeze(
  {
    outputChanged() {},
    ready() {},
    dispose() {},
  } satisfies t.ViteDev.Screen.Reporter,
);

const DEFAULT_TERMINAL = Object.freeze(
  {
    cursorRows: 1,
    size: () => Cli.Screen.size(),
    events: (until) => Cli.Screen.events(until),
    repaint: (frame) => Cli.Screen.repaint(frame),
    spinner: () => Cli.Spinner.create('', { target: 'stdout' }),
  } satisfies t.ViteDev.Screen.Runtime.Terminal,
);

/** Effectful owner of one responsive dev-screen startup → ready → disposed lifecycle. */
export const DevScreenRuntime = {
  create(args: t.ViteDev.Screen.Runtime.CreateArgs): t.ViteDev.Screen.Reporter {
    const { pkg, dist, paths, output } = args;
    const terminal = args.deps?.terminal ?? DEFAULT_TERMINAL;
    const schedule = args.deps?.schedule ?? ((run) => Time.delay(REPAINT_DELAY, run));
    const logLines = DevScreenLayout.logLines(args.logLines);
    const screenEvents = terminal.events(args.until);
    if (screenEvents.disposed) return DISPOSED_REPORTER;

    let spinner: t.Cli.Spinner.Instance;
    try {
      spinner = terminal.spinner();
    } catch (error) {
      try {
        screenEvents.dispose();
      } catch {
        // Preserve the spinner-acquisition error.
      }
      throw error;
    }

    let phase: Phase = 'startup';
    let pending: Invalidation | undefined;
    let scheduleGeneration = 0;
    let acquiringSchedule: number | undefined;
    let scheduledTask: t.Cancellable | undefined;
    let resizeSubscription: ResizeSubscription | undefined;
    let spinnerRunning = false;
    let viewport: t.Cli.Screen.Size = { width: 0, height: 0 };
    let hasViewport = false;
    let acquired = false;

    const frameArgs = (): t.ViteDev.Screen.Frame.Args => ({
      pkg,
      dist,
      paths,
      url: args.url(),
      lines: output.lines(),
      logLines,
      viewport,
      cursorRows: terminal.cursorRows,
      renderedAt: Time.now.timestamp,
    });

    const startupFrame = () => DevScreenLayout.startup(frameArgs());
    const readyFrame = () => DevScreenLayout.toString(frameArgs());

    const startSpinner = () => {
      if (spinnerRunning) return;
      spinnerRunning = true;
      try {
        spinner.start();
      } catch (error) {
        spinnerRunning = false;
        try {
          spinner.stop();
        } catch {
          // Preserve the construction/render error that caused rollback.
        }
        throw error;
      }
    };

    const stopSpinner = () => {
      if (!spinnerRunning) return;
      spinnerRunning = false;
      spinner.stop();
    };

    const installStartupBody = (frame: t.ViteDev.Screen.Frame.StartupOutput) => {
      spinner.text = frame.body ? `\n${frame.body}` : '';
    };

    const renderStartupContent = () => {
      const frame = startupFrame();
      if (frame.showSpinner) installStartupBody(frame);
    };

    const renderStartupLayout = () => {
      stopSpinner();
      const frame = startupFrame();
      terminal.repaint(frame.header);
      if (frame.showSpinner) {
        installStartupBody(frame);
        startSpinner();
      }
    };

    const renderReady = () => {
      terminal.repaint(readyFrame());
    };

    const render = (kind: Invalidation) => {
      if (phase === 'disposed') return;
      if (phase === 'ready') {
        renderReady();
        return;
      }
      if (kind === 'content') renderStartupContent();
      else renderStartupLayout();
    };

    const flushPending = () => {
      const kind = pending;
      pending = undefined;
      if (kind) render(kind);
    };

    const cancelScheduled = () => {
      scheduleGeneration += 1;
      acquiringSchedule = undefined;
      const task = scheduledTask;
      scheduledTask = undefined;
      task?.cancel();
    };

    const discardPending = () => {
      pending = undefined;
      cancelScheduled();
    };

    const schedulePending = () => {
      if (scheduledTask || acquiringSchedule !== undefined) return;
      const generation = ++scheduleGeneration;
      acquiringSchedule = generation;
      let task: t.Cancellable;
      try {
        task = schedule(() => {
          if (generation !== scheduleGeneration) return;
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

    const mergePending = (kind: Invalidation) => {
      pending = pending === 'layout' || kind === 'layout' ? 'layout' : 'content';
    };

    const request = (kind: Invalidation) => {
      if (phase === 'disposed') return;
      mergePending(kind);
      schedulePending();
    };

    const unsubscribeResize = () => {
      const subscription = resizeSubscription;
      resizeSubscription = undefined;
      subscription?.unsubscribe();
    };

    const releaseEvents = () => screenEvents.dispose();

    const release = () => {
      runCleanup([discardPending, unsubscribeResize, releaseEvents, stopSpinner]);
    };

    try {
      resizeSubscription = screenEvents.resize$.subscribe((event) => {
        viewport = { ...event.after };
        hasViewport = true;
        if (acquired) request('layout');
      });
      if (!hasViewport) {
        const initial = terminal.size();
        if (!hasViewport) viewport = { ...initial };
      }
      renderStartupLayout();
      acquired = true;
    } catch (error) {
      phase = 'disposed';
      try {
        release();
      } catch {
        // Preserve the acquisition/render error.
      }
      throw error;
    }

    return {
      outputChanged() {
        request('content');
      },

      ready() {
        if (phase !== 'startup') return;
        phase = 'ready';
        runCleanup([discardPending, stopSpinner, renderReady]);
      },

      dispose() {
        if (phase === 'disposed') return;
        phase = 'disposed';
        release();
      },
    };
  },
} as const;

/**
 * Helpers:
 */
function runCleanup(actions: Cleanup[]) {
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
