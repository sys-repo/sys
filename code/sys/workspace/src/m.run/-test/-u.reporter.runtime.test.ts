import { FakeSpinner } from '@sys/cli/testing';
import { c, Cli, describe, expect, it, type t } from '../../-test.ts';
import {
  createDefaultParallelReporterRuntimeDeps,
  createParallelReporterRuntime,
  type ParallelReporterRuntime,
  type ParallelReporterRuntimeDeps,
} from '../u.reporter/mod.ts';
import { createReporterScreen } from './u.fixture.reporter.ts';

type Scheduled = {
  readonly run: () => void;
  canceled: boolean;
};

describe('WorkspaceRun.parallel reporter runtime', () => {
  describe('canonical dependencies', () => {
    it('binds the spinner session to stdout', () => {
      using stub = FakeSpinner.stub();

      const spinner = createDefaultParallelReporterRuntimeDeps().spinner();

      expect(spinner).to.equal(stub.spinner);
      expect(stub.calls).to.eql([{ text: '', options: { target: 'stdout' } }]);
    });
  });

  describe('session lifecycle', () => {
    it('acquires one accepted viewport and one stdout-aligned spinner session', () => {
      const harness = createHarness({ viewport: { width: 100, height: 30 } });

      harness.runtime.start();

      expect(harness.sizeCalls()).to.eql(1);
      expect(harness.eventsCalls()).to.eql(1);
      expect(harness.frames).to.eql([{ width: 100, height: 30, cursorRows: 1 }]);
      expect(harness.spinner.starts).to.eql(1);
      expect(harness.spinner.stops).to.eql(0);
      expect(harness.spinner.text).to.eql('100x30');

      harness.runtime.stop();
      expect(harness.effects).to.eql(['spinner:start', 'spinner:stop', 'repaint']);
      expect(harness.repaints).to.eql(['100x30']);
    });

    it('transports one styled frame byte-identically through spinner and persisted repaint', () => {
      const frame = `${c.green('✓')} ${c.gray(c.italic('styled frame'))}`;
      const harness = createHarness({ frame });

      harness.runtime.start();
      expect(harness.spinner.text).to.eql(frame);
      expect(Cli.stripAnsi(harness.spinner.text)).to.eql('✓ styled frame');

      harness.runtime.stop();
      expect(harness.repaints).to.eql([frame]);
    });

    it('subscribes before initial measurement and keeps a synchronous accepted resize', () => {
      const harness = createHarness({
        viewport: { width: 100, height: 30 },
        resizeOnSize: { width: 72, height: 18 },
      });

      harness.runtime.start();

      expect(harness.frames).to.eql([{ width: 72, height: 18, cursorRows: 1 }]);
      harness.runtime.stop();
    });
  });

  describe('resize scheduling', () => {
    it('adopts exact resize snapshots and coalesces to the latest viewport', () => {
      const harness = createHarness({ viewport: { width: 100, height: 30 } });
      harness.runtime.start();

      harness.screen.resize({ width: 80, height: 20 });
      const latest = { width: 64, height: 12 };
      harness.screen.resize(latest);
      latest.width = 1;
      latest.height = 1;

      expect(harness.scheduler.active()).to.eql(1);
      expect(harness.scheduler.schedules()).to.eql(1);
      expect(harness.frames).to.have.length(1);

      harness.scheduler.flush();

      expect(harness.frames.at(-1)).to.eql({ width: 64, height: 12, cursorRows: 1 });
      expect(harness.spinner.text).to.eql('64x12');

      harness.runtime.stop();
    });

    it('lets a scheduler event absorb pending resize work into one immediate frame', () => {
      const harness = createHarness({ viewport: { width: 100, height: 30 } });
      harness.runtime.start();
      harness.screen.resize({ width: 72, height: 18 });

      harness.runtime.render();

      expect(harness.scheduler.cancels()).to.eql(1);
      expect(harness.scheduler.active()).to.eql(0);
      expect(harness.frames.at(-1)).to.eql({ width: 72, height: 18, cursorRows: 1 });

      const count = harness.frames.length;
      harness.scheduler.force(0);
      expect(harness.frames).to.have.length(count);

      harness.runtime.stop();
    });
  });

  describe('acquisition rollback', () => {
    it('preserves an events-factory error without acquiring later resources', () => {
      const harness = createHarness();
      const cause = new Error('events-factory-failed');
      const runtime = createParallelReporterRuntime({
        deps: {
          ...harness.deps,
          events() {
            throw cause;
          },
        },
        frame: () => 'frame',
      });

      expect(startFailure(runtime)).to.equal(cause);
      expect(harness.spinner.starts).to.eql(0);
      expect(harness.spinner.stops).to.eql(0);
      expect(harness.screen.events.disposed).to.eql(false);
    });

    it('rolls back events when spinner-factory acquisition fails', () => {
      const harness = createHarness();
      const cause = new Error('spinner-factory-failed');
      const runtime = createParallelReporterRuntime({
        deps: {
          ...harness.deps,
          spinner() {
            throw cause;
          },
        },
        frame: () => 'frame',
      });

      expect(startFailure(runtime)).to.equal(cause);
      expect(harness.spinner.starts).to.eql(0);
      expect(harness.spinner.stops).to.eql(0);
      expect(harness.screen.events.disposed).to.eql(true);
    });

    it('rolls back events when resize-subscription acquisition fails', () => {
      const harness = createHarness();
      const cause = new Error('resize-subscription-failed');
      const resize$ = harness.screen.events.resize$;
      const subscribe = resize$.subscribe;
      Object.defineProperty(resize$, 'subscribe', {
        configurable: true,
        value: () => {
          throw cause;
        },
      });

      const failure = startFailure(harness.runtime);
      Object.defineProperty(resize$, 'subscribe', { configurable: true, value: subscribe });

      expect(failure).to.equal(cause);
      expect(harness.spinner.starts).to.eql(0);
      expect(harness.spinner.stops).to.eql(0);
      expect(harness.screen.events.disposed).to.eql(true);
    });

    it('rolls back subscription and events when initial viewport acquisition fails', () => {
      const harness = createHarness();
      const cause = new Error('initial-size-failed');
      const runtime = createParallelReporterRuntime({
        deps: {
          ...harness.deps,
          size() {
            throw cause;
          },
        },
        frame: () => 'frame',
      });

      expect(startFailure(runtime)).to.equal(cause);
      expect(harness.spinner.starts).to.eql(0);
      expect(harness.spinner.stops).to.eql(0);
      expect(harness.screen.events.disposed).to.eql(true);
    });

    it('rolls back acquired resources when first-frame rendering fails', () => {
      const harness = createHarness();
      const cause = new Error('first-frame-failed');
      const runtime = createParallelReporterRuntime({
        deps: harness.deps,
        frame() {
          throw cause;
        },
      });

      expect(startFailure(runtime)).to.equal(cause);
      expect(harness.spinner.starts).to.eql(0);
      expect(harness.spinner.stops).to.eql(0);
      expect(harness.screen.events.disposed).to.eql(true);
    });

    it('rolls back a started terminal session when tick acquisition fails', () => {
      const harness = createHarness();
      const cause = new Error('tick-start-failed');
      const runtime = createParallelReporterRuntime({
        deps: {
          ...harness.deps,
          tick() {
            throw cause;
          },
        },
        frame: () => 'frame',
      });
      let thrown: unknown;

      try {
        runtime.start();
      } catch (error) {
        thrown = error;
      }

      expect(thrown).to.equal(cause);
      expect(harness.spinner.starts).to.eql(1);
      expect(harness.spinner.stops).to.eql(1);
      expect(harness.screen.events.disposed).to.eql(true);
    });

    it('rolls back acquisition without masking a spinner-start error', () => {
      const cause = new Error('spinner-start-failed');
      const spinner = FakeSpinner.create();
      spinner.start = () => {
        spinner.starts += 1;
        throw cause;
      };
      spinner.stop = () => {
        spinner.stops += 1;
        throw new Error('spinner-stop-failed');
      };
      const harness = createHarness({ spinner });
      let thrown: unknown;

      try {
        harness.runtime.start();
      } catch (error) {
        thrown = error;
      }

      expect(thrown).to.equal(cause);
      expect(spinner.starts).to.eql(1);
      expect(spinner.stops).to.eql(1);
      expect(harness.screen.events.disposed).to.eql(true);
    });
  });

  describe('shutdown', () => {
    it('stops without repaint when output transfers to ordinary scrollback', () => {
      const harness = createHarness();

      harness.runtime.start();
      harness.runtime.stop(false);

      expect(harness.effects).to.eql(['spinner:start', 'spinner:stop']);
      expect(harness.repaints).to.eql([]);
      expect(harness.screen.events.disposed).to.eql(true);
    });

    it('persists the final frame without masking a spinner-stop failure', () => {
      const spinner = FakeSpinner.create();
      const cause = new Error('spinner-stop-failed');
      const stop = spinner.stop;
      spinner.stop = () => {
        stop();
        throw cause;
      };
      const harness = createHarness({ spinner });
      let thrown: unknown;
      harness.runtime.start();

      try {
        harness.runtime.stop();
      } catch (error) {
        thrown = error;
      }
      harness.runtime.stop();

      expect(thrown).to.equal(cause);
      expect(spinner.stops).to.eql(1);
      expect(harness.repaints).to.eql(['100x30']);
      expect(harness.screen.events.disposed).to.eql(true);
    });

    it('disposes scheduled work, tick, resize subscription, events, and spinner exactly once', () => {
      const harness = createHarness();
      harness.runtime.start();
      harness.screen.resize({ width: 70, height: 16 });

      harness.runtime.stop();
      harness.runtime.stop();
      harness.runtime.render();

      expect(harness.scheduler.cancels()).to.eql(1);
      expect(harness.ticker.cancels()).to.eql(1);
      expect(harness.spinner.stops).to.eql(1);
      expect(harness.screen.events.disposed).to.eql(true);

      const count = harness.frames.length;
      harness.scheduler.force(0);
      harness.ticker.force();
      harness.screen.resize({ width: 40, height: 10 });
      expect(harness.frames).to.have.length(count);
    });
  });
});

function startFailure(runtime: ParallelReporterRuntime) {
  try {
    runtime.start();
  } catch (error) {
    return error;
  }
}

function createHarness(options: {
  frame?: string;
  viewport?: t.Cli.Screen.Size;
  resizeOnSize?: t.Cli.Screen.Size;
  spinner?: ReturnType<typeof FakeSpinner.create>;
} = {}) {
  const screen = createReporterScreen();
  const scheduler = createScheduler();
  const ticker = createTicker();
  const spinner = options.spinner ?? FakeSpinner.create();
  const effects: string[] = [];
  const repaints: string[] = [];
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
  const frames: Array<t.Cli.Screen.Size & { cursorRows: number }> = [];
  const viewport = options.viewport ?? { width: 100, height: 30 };
  let sizeCalls = 0;
  let eventsCalls = 0;
  const deps: ParallelReporterRuntimeDeps = {
    cursorRows: 1,
    size() {
      sizeCalls += 1;
      if (options.resizeOnSize) screen.resize(options.resizeOnSize);
      return { ...viewport };
    },
    events() {
      eventsCalls += 1;
      return screen.events;
    },
    spinner: () => spinner,
    repaint(frame) {
      effects.push('repaint');
      repaints.push(frame);
    },
    schedule: scheduler.schedule,
    tick: ticker.start,
  };
  const runtime = createParallelReporterRuntime({
    deps,
    frame({ viewport, cursorRows }) {
      frames.push({ ...viewport, cursorRows });
      return options.frame ?? `${viewport.width}x${viewport.height}`;
    },
  });

  return {
    deps,
    effects,
    eventsCalls: () => eventsCalls,
    frames,
    repaints,
    runtime,
    scheduler,
    screen,
    sizeCalls: () => sizeCalls,
    spinner,
    ticker,
  };
}

function createScheduler() {
  const entries: Scheduled[] = [];
  let scheduleCount = 0;
  let cancelCount = 0;

  const schedule = (run: () => void): t.Cancellable => {
    scheduleCount += 1;
    const entry: Scheduled = { run, canceled: false };
    entries.push(entry);
    return {
      cancel() {
        if (entry.canceled) return;
        entry.canceled = true;
        cancelCount += 1;
      },
    };
  };

  return {
    active: () => entries.filter((entry) => !entry.canceled).length,
    cancels: () => cancelCount,
    flush() {
      const entry = entries.find((item) => !item.canceled);
      if (!entry) return;
      entry.canceled = true;
      entry.run();
    },
    force(index: number) {
      entries[index]?.run();
    },
    schedule,
    schedules: () => scheduleCount,
  };
}

function createTicker() {
  let callback: (() => void) | undefined;
  let cancelCount = 0;

  return {
    cancels: () => cancelCount,
    force: () => callback?.(),
    start(run: () => void): t.Cancellable {
      callback = run;
      let canceled = false;
      return {
        cancel() {
          if (canceled) return;
          canceled = true;
          cancelCount += 1;
        },
      };
    },
  };
}
