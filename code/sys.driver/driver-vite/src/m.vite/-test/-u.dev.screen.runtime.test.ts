import { FakeSpinner } from '@sys/cli/testing';
import { describe, expect, it, Rx, stripAnsi } from '../../-test.ts';
import { type t } from '../common.ts';
import { DevOutputLog } from '../u/u.dev.output.ts';
import { DevScreen } from '../u/u.dev.screen.ts';
import { paths, pkg, processEvent } from './u.fixture.dev.ts';

type SchedulerEntry = {
  readonly run: () => void;
  canceled: boolean;
  complete: boolean;
};

describe('DevScreen runtime', () => {
  describe('session acquisition', () => {
    it('starts with one header repaint, one spinner, and the seeded status row', () => {
      const runtime = createRuntimeHarness();
      const { reporter, spinner, repaints } = runtime;

      expect(repaints.length).to.eql(1);
      expect(stripAnsi(repaints[0] ?? '').startsWith('@sys/example')).to.eql(true);
      expect(runtime.effects).to.eql(['repaint', 'spinner:start']);
      expect(spinner.starts).to.eql(1);
      expect(spinner.stops).to.eql(0);
      expect(spinner.renders).to.eql(0);
      expect(stripAnsi(spinner.text)).to.include(' 1  out  starting dev server…');

      reporter.dispose();
    });

    it('stays inert when terminal observation is already disposed', () => {
      const runtime = createRuntimeHarness({ disposedEvents: true });
      const { reporter, spinner, terminal } = runtime;

      reporter.outputChanged();
      reporter.ready();
      reporter.dispose();

      expect(runtime.repaints).to.eql([]);
      expect(spinner.starts).to.eql(0);
      expect(spinner.stops).to.eql(0);
      expect(terminal.events.disposed).to.eql(true);
    });

    it('subscribes before initial measurement and adopts a synchronous accepted viewport', () => {
      const controller = new AbortController();
      const runtime = createRuntimeHarness({
        until: controller.signal,
        resizeOnSize: { width: 36, height: 15 },
      });

      expect(runtime.terminal.until).to.equal(controller.signal);
      expect(stripAnsi(runtime.repaints[0] ?? '').split('\n')[1]).to.eql('━'.repeat(36));

      runtime.reporter.dispose();
    });

    it('rolls back a partially started spinner without masking the acquisition error', () => {
      const output = createOutputLog();
      const spinner = FakeSpinner.create();
      const cause = new Error('spinner-start-failed');
      let thrown: unknown;
      spinner.start = () => {
        spinner.starts += 1;
        throw cause;
      };
      spinner.stop = () => {
        spinner.stops += 1;
        throw new Error('spinner-stop-failed');
      };

      const terminal = createTerminalHarness(spinner);
      try {
        DevScreen.create({
          pkg: pkg(),
          paths: paths(),
          url: () => 'http://localhost:1234/',
          output,
          deps: { terminal: terminal.deps },
        });
      } catch (error) {
        thrown = error;
      }

      expect(thrown).to.equal(cause);
      expect(spinner.starts).to.eql(1);
      expect(spinner.stops).to.eql(1);
      expect(terminal.events.disposed).to.eql(true);
    });

    it('releases acquired screen effects without masking an initial repaint failure', () => {
      const output = createOutputLog();
      const spinner = FakeSpinner.create();
      const terminal = createTerminalHarness(spinner);
      const cause = new Error('repaint-failed');
      let thrown: unknown;
      terminal.deps.repaint = () => {
        throw cause;
      };

      try {
        DevScreen.create({
          pkg: pkg(),
          paths: paths(),
          url: () => 'http://localhost:1234/',
          output,
          deps: { terminal: terminal.deps },
        });
      } catch (error) {
        thrown = error;
      }

      expect(thrown).to.equal(cause);
      expect(spinner.starts).to.eql(0);
      expect(spinner.stops).to.eql(0);
      expect(terminal.events.disposed).to.eql(true);
    });
  });

  describe('startup phase', () => {
    it('coalesces output and updates only the declared spinner text contract', () => {
      const runtime = createRuntimeHarness();
      const { output, reporter, scheduler, spinner } = runtime;

      output.push(processEvent('stdout', 'transforming modules…\n'));
      reporter.outputChanged();
      reporter.outputChanged();

      expect(scheduler.schedules).to.eql(1);
      expect(scheduler.active).to.eql(1);
      expect(stripAnsi(spinner.text)).to.not.include('transforming modules…');

      scheduler.flush();

      expect(scheduler.active).to.eql(0);
      expect(stripAnsi(spinner.text)).to.include('transforming modules…');
      expect(spinner.starts).to.eql(1);
      expect(spinner.stops).to.eql(0);
      expect(spinner.renders).to.eql(0);
      expect(runtime.repaints.length).to.eql(1);

      reporter.dispose();
    });

    it('rebuilds the complete startup layout from the latest coalesced viewport', () => {
      const runtime = createRuntimeHarness();
      const { reporter, scheduler, spinner, terminal } = runtime;

      terminal.resize({ width: 30, height: 12 });
      const latest = { width: 20, height: 10 };
      terminal.resize(latest, false);
      latest.width = 8;
      latest.height = 4;

      expect(scheduler.schedules).to.eql(1);
      scheduler.flush();

      expect(runtime.repaints.length).to.eql(2);
      expect(stripAnsi(runtime.repaints.at(-1) ?? '').split('\n')[1]).to.eql('━'.repeat(20));
      expect(runtime.effects).to.eql([
        'repaint',
        'spinner:start',
        'spinner:stop',
        'repaint',
        'spinner:start',
      ]);
      expect(spinner.starts).to.eql(2);
      expect(spinner.stops).to.eql(1);

      reporter.dispose();
    });

    it('accepts subsequent output after synchronous scheduler completion', () => {
      const output = createOutputLog();
      const spinner = FakeSpinner.create();
      let schedules = 0;
      const terminal = createTerminalHarness(spinner);
      const reporter = DevScreen.create({
        pkg: pkg(),
        paths: paths(),
        url: () => 'http://localhost:1234/',
        output,
        deps: {
          terminal: terminal.deps,
          schedule: (run) => {
            schedules += 1;
            run();
            return { cancel: () => {} };
          },
        },
      });

      output.push(processEvent('stdout', 'one\n'));
      reporter.outputChanged();
      output.push(processEvent('stdout', 'two\n'));
      reporter.outputChanged();

      expect(schedules).to.eql(2);
      expect(stripAnsi(spinner.text)).to.include(' out  one');
      expect(stripAnsi(spinner.text)).to.include(' out  two');
      expect(spinner.renders).to.eql(0);

      reporter.dispose();
    });
  });

  describe('startup → ready', () => {
    it('absorbs a pending resize into one ready frame at the accepted viewport', () => {
      const runtime = createRuntimeHarness();
      const { reporter, scheduler, terminal } = runtime;

      terminal.resize({ width: 32, height: 14 }, false);
      reporter.ready();

      expect(scheduler.cancels).to.eql(1);
      expect(runtime.repaints.length).to.eql(2);
      expect(stripAnsi(runtime.repaints.at(-1) ?? '').split('\n')[1]).to.eql('━'.repeat(32));
      const repaints = runtime.repaints.length;

      scheduler.force(0);
      expect(runtime.repaints.length).to.eql(repaints);

      reporter.dispose();
    });

    it('adopts ready and stops the spinner without masking a repaint failure', () => {
      const runtime = createRuntimeHarness();
      const cause = new Error('ready-repaint-failed');
      let thrown: unknown;
      runtime.terminal.deps.repaint = () => {
        throw cause;
      };

      try {
        runtime.reporter.ready();
      } catch (error) {
        thrown = error;
      }
      runtime.reporter.ready();

      expect(thrown).to.equal(cause);
      expect(runtime.spinner.starts).to.eql(1);
      expect(runtime.spinner.stops).to.eql(1);
      expect(runtime.effects).to.eql(['repaint', 'spinner:start', 'spinner:stop']);

      runtime.reporter.dispose();
      expect(runtime.terminal.events.disposed).to.eql(true);
    });

    it('absorbs pending startup work and transitions exactly once', () => {
      const runtime = createRuntimeHarness();
      const { output, reporter, scheduler, spinner } = runtime;

      output.push(processEvent('stdout', 'VITE v8.1.5 ready in 10 ms\n'));
      reporter.outputChanged();
      expect(scheduler.schedules).to.eql(1);

      reporter.ready();
      reporter.ready();

      expect(scheduler.cancels).to.eql(1);
      expect(scheduler.active).to.eql(0);
      expect(spinner.starts).to.eql(1);
      expect(spinner.stops).to.eql(1);
      expect(runtime.repaints.length).to.eql(2);
      expect(runtime.effects).to.eql(['repaint', 'spinner:start', 'spinner:stop', 'repaint']);
      const ready = stripAnsi(runtime.repaints[1] ?? '');
      expect(ready).to.include(' 1  out  starting dev server…');
      expect(ready).to.include('VITE v8.1.5 ready in 10 ms');

      scheduler.force(0);
      expect(runtime.repaints.length).to.eql(2);
      expect(spinner.starts).to.eql(1);
      expect(spinner.stops).to.eql(1);

      reporter.dispose();
      expect(spinner.stops).to.eql(1);
    });
  });

  describe('ready phase', () => {
    it('repaints the complete ready frame from the accepted resize snapshot', () => {
      const runtime = createRuntimeHarness();
      const { reporter, scheduler, terminal } = runtime;
      reporter.ready();
      const repaints = runtime.repaints.length;

      terminal.resize({ width: 26, height: 12 }, false);
      expect(scheduler.schedules).to.eql(1);
      scheduler.flush();

      const text = runtime.repaints.at(-1) ?? '';
      expect(runtime.repaints.length).to.eql(repaints + 1);
      expect(stripAnsi(text).split('\n')[1]).to.eql('━'.repeat(26));
      expect(text.split('\n').length <= 11).to.eql(true);

      reporter.dispose();
    });

    it('reprojects docked controls across wide, narrow, and wide resize transitions', () => {
      const runtime = createRuntimeHarness();
      const { reporter, scheduler, terminal } = runtime;
      reporter.ready();

      const initial = stripAnsi(runtime.repaints.at(-1) ?? '');
      expect(initial).to.include('open: o (in browser)');
      expect(initial).to.include('quit: ctrl + c or q');

      terminal.resize({ width: 40, height: 24 }, false);
      scheduler.flush();
      const narrow = stripAnsi(runtime.repaints.at(-1) ?? '');
      expect(narrow).to.not.include('open:');
      expect(narrow).to.not.include('quit:');

      terminal.resize({ width: 80, height: 24 }, false);
      scheduler.flush();
      const wide = stripAnsi(runtime.repaints.at(-1) ?? '');
      expect(wide).to.eql(initial);

      reporter.dispose();
    });

    it('coalesces output into one complete repaint', () => {
      const runtime = createRuntimeHarness();
      const { output, reporter, scheduler } = runtime;
      reporter.ready();
      const repaints = runtime.repaints.length;

      output.push(processEvent('stdout', 'one\n'));
      reporter.outputChanged();
      output.push(processEvent('stderr', 'two\n'));
      reporter.outputChanged();

      expect(scheduler.schedules).to.eql(1);
      scheduler.flush();

      expect(runtime.repaints.length).to.eql(repaints + 1);
      expect(stripAnsi(runtime.repaints.at(-1) ?? '')).to.include(' out  one');
      expect(stripAnsi(runtime.repaints.at(-1) ?? '')).to.include(' err  two');

      reporter.dispose();
    });
  });

  describe('disposal', () => {
    it('attempts every teardown when cancellation, event disposal, and spinner stop fail', () => {
      const output = createOutputLog();
      const spinner = FakeSpinner.create();
      const cancelCause = new Error('cancel-failed');
      const eventCause = new Error('event-dispose-failed');
      const spinnerCause = new Error('spinner-stop-failed');
      let eventDisposals = 0;
      let thrown: unknown;
      const terminal = createTerminalHarness(spinner);
      const events = terminal.screenEvents;
      const failingEvents: t.Cli.Screen.Events = {
        $: events.$,
        resize$: events.resize$,
        get dispose$() {
          return events.dispose$;
        },
        get disposed() {
          return events.disposed;
        },
        dispose(reason) {
          eventDisposals += 1;
          events.dispose(reason);
          throw eventCause;
        },
      };
      const stopSpinner = spinner.stop;
      spinner.stop = () => {
        stopSpinner();
        throw spinnerCause;
      };

      const reporter = DevScreen.create({
        pkg: pkg(),
        paths: paths(),
        url: () => 'http://localhost:1234/',
        output,
        deps: {
          terminal: { ...terminal.deps, events: () => failingEvents },
          schedule: () => ({
            cancel: () => {
              throw cancelCause;
            },
          }),
        },
      });
      reporter.outputChanged();

      try {
        reporter.dispose();
      } catch (error) {
        thrown = error;
      }
      reporter.dispose();
      reporter.outputChanged();

      expect(thrown).to.equal(cancelCause);
      expect(eventDisposals).to.eql(1);
      expect(spinner.stops).to.eql(1);
      expect(events.disposed).to.eql(true);
    });

    it('is terminal with exact-once cancellation and spinner stop', () => {
      const runtime = createRuntimeHarness();
      const { output, reporter, scheduler, spinner, terminal } = runtime;
      output.push(processEvent('stdout', 'retained\n'));
      reporter.outputChanged();

      reporter.dispose();
      reporter.dispose();

      expect(scheduler.cancels).to.eql(1);
      expect(spinner.stops).to.eql(1);
      const repaints = runtime.repaints.length;

      scheduler.force(0);
      reporter.outputChanged();
      reporter.ready();

      expect(runtime.repaints.length).to.eql(repaints);
      expect(output.lines().map((item) => item.text)).to.eql([
        'starting dev server…',
        'retained',
      ]);
      expect(spinner.starts).to.eql(1);
      expect(spinner.stops).to.eql(1);
      expect(spinner.renders).to.eql(0);
      expect(terminal.events.disposed).to.eql(true);

      terminal.resize({ width: 20, height: 10 });
      expect(runtime.repaints.length).to.eql(repaints);
    });
  });
});

/**
 * Helpers:
 */
function createRuntimeHarness(options: {
  until?: t.UntilInput;
  resizeOnSize?: t.ViteDev.Screen.Frame.Viewport;
  disposedEvents?: boolean;
} = {}) {
  const output = createOutputLog();
  const spinner = FakeSpinner.create();
  const effects: string[] = [];
  const startSpinner = spinner.start;
  const stopSpinner = spinner.stop;
  spinner.start = (text) => {
    effects.push('spinner:start');
    return startSpinner(text);
  };
  spinner.stop = () => {
    effects.push('spinner:stop');
    return stopSpinner();
  };
  const scheduler = createScheduler();
  const terminal = createTerminalHarness(spinner, {
    resizeOnSize: options.resizeOnSize,
    disposedEvents: options.disposedEvents,
  });
  const repaint = terminal.deps.repaint;
  terminal.deps.repaint = (frame) => {
    effects.push('repaint');
    repaint(frame);
  };
  const reporter = DevScreen.create({
    pkg: pkg(),
    paths: paths(),
    url: () => 'http://localhost:1234/',
    output,
    logLines: 5,
    until: options.until,
    deps: {
      terminal: terminal.deps,
      schedule: scheduler.schedule,
    },
  });

  return {
    output,
    reporter,
    scheduler,
    spinner,
    terminal,
    effects,
    repaints: terminal.repaints,
  };
}

function createTerminalHarness(
  spinner: t.Cli.Spinner.Instance,
  options: {
    resizeOnSize?: t.ViteDev.Screen.Frame.Viewport;
    disposedEvents?: boolean;
  } = {},
) {
  let viewport: t.ViteDev.Screen.Frame.Viewport = { width: 80, height: 24 };
  let until: t.UntilInput | undefined;
  let sizeCalls = 0;
  const repaints: string[] = [];
  const events = Rx.lifecycle();
  const resize$$ = Rx.subject<t.Cli.Screen.SizeChanged>();
  const resize$ = resize$$.asObservable();
  const screenEvents = Rx.toLifecycle<t.Cli.Screen.Events>(events, { $: resize$, resize$ });
  if (options.disposedEvents) events.dispose();
  const deps: t.ViteDev.Screen.Runtime.Terminal = {
    cursorRows: 1,
    size: () => {
      const measured = { ...viewport };
      if (sizeCalls++ === 0 && options.resizeOnSize) {
        resize$$.next({ kind: 'size:changed', before: measured, after: options.resizeOnSize });
      }
      return measured;
    },
    events: (input) => {
      until = input;
      return screenEvents;
    },
    repaint: (frame) => repaints.push(frame),
    spinner: () => spinner,
  };

  return {
    deps,
    events,
    screenEvents,
    repaints,
    resize(next: t.ViteDev.Screen.Frame.Viewport, updateMeasurement = true) {
      const before = viewport;
      if (updateMeasurement) viewport = { ...next };
      resize$$.next({ kind: 'size:changed', before, after: next });
    },
    get until() {
      return until;
    },
  };
}

function createOutputLog() {
  const output = DevOutputLog.create({ maxLines: 10 });
  output.pushDisplay('stdout', 'starting dev server…');
  return output;
}

function createScheduler() {
  const tasks: SchedulerEntry[] = [];
  let schedules = 0;
  let cancels = 0;

  const schedule = (run: () => void) => {
    schedules += 1;
    const task: SchedulerEntry = { run, canceled: false, complete: false };
    tasks.push(task);
    return {
      cancel() {
        if (task.canceled || task.complete) return;
        task.canceled = true;
        cancels += 1;
      },
    };
  };

  const invoke = (task: SchedulerEntry | undefined, force: boolean) => {
    if (!task || task.complete || (!force && task.canceled)) return;
    task.complete = true;
    task.run();
  };

  return {
    schedule,
    flush() {
      invoke(tasks.find((task) => !task.canceled && !task.complete), false);
    },
    force(index: number) {
      invoke(tasks[index], true);
    },
    get schedules() {
      return schedules;
    },
    get cancels() {
      return cancels;
    },
    get active() {
      return tasks.filter((task) => !task.canceled && !task.complete).length;
    },
  };
}
