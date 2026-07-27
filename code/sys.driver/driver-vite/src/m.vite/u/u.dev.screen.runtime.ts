import { Cli, type t, Time } from '../common.ts';
import { DevScreenLayout } from './u.dev.screen.layout.ts';

type Phase = t.ViteDev.Screen.Runtime.RenderPhase | 'disposed';
type Invalidation = 'content' | 'layout';

const REDRAW_DELAY = 50 as t.Msecs;

/** Effectful owner of one dev-screen startup → ready → disposed lifecycle. */
export const DevScreenRuntime = {
  create(args: t.ViteDev.Screen.Runtime.CreateArgs): t.ViteDev.Screen.Reporter {
    const { pkg, dist, paths, output } = args;
    const clear = args.deps?.clear ?? (() => console.clear());
    const print = args.deps?.print ?? ((phase, text) => {
      if (phase === 'startup') console.error(text);
      else console.info(text);
    });
    const spinner = (args.deps?.spinner ?? (() => Cli.Spinner.create('')))();
    const schedule = args.deps?.schedule ?? ((run) => Time.delay(REDRAW_DELAY, run));
    const logLines = DevScreenLayout.logLines(args.logLines);

    let phase: Phase = 'startup';
    let pending: Invalidation | undefined;
    let scheduleGeneration = 0;
    let acquiringSchedule: number | undefined;
    let scheduledTask: t.Cancellable | undefined;
    let spinnerRunning = false;
    let showOptions = false;
    let ws: t.ViteDenoWorkspace | undefined;

    const frameArgs = (): t.ViteDev.Screen.Frame.Args => ({
      pkg,
      dist,
      paths,
      url: args.url(),
      lines: output.lines(),
      logLines,
    });

    const startupBody = () => DevScreenLayout.startupBody(frameArgs());
    const readyFrame = () => DevScreenLayout.toString({ ...frameArgs(), showOptions, ws });

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

    const renderStartupContent = () => {
      spinner.text = `\n${startupBody()}`;
    };

    const renderStartupLayout = () => {
      stopSpinner();
      clear();
      print('startup', DevScreenLayout.startupHeader(pkg));
      renderStartupContent();
      startSpinner();
    };

    const renderReady = () => {
      clear();
      print('ready', readyFrame());
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

    const flushNow = (kind: Invalidation) => {
      if (phase === 'disposed') return;
      mergePending(kind);
      try {
        cancelScheduled();
      } finally {
        flushPending();
      }
    };

    try {
      renderStartupLayout();
    } catch (error) {
      phase = 'disposed';
      discardPending();
      try {
        stopSpinner();
      } catch {
        // Preserve the initial render error.
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
        try {
          discardPending();
        } finally {
          try {
            stopSpinner();
          } finally {
            renderReady();
          }
        }
      },

      clearLog() {
        if (phase === 'disposed') return;
        output.clearLines();
        flushNow('layout');
      },

      toggleOptions() {
        if (phase === 'disposed') return;
        showOptions = !showOptions;
        flushNow('layout');
      },

      toggleExtended(next) {
        if (phase === 'disposed') return;
        ws = ws ? undefined : next;
        flushNow('layout');
      },

      dispose() {
        if (phase === 'disposed') return;
        phase = 'disposed';
        try {
          discardPending();
        } finally {
          stopSpinner();
        }
      },
    };
  },
} as const;
