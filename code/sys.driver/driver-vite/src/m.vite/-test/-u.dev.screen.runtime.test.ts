import { FakeSpinner } from '@sys/cli/testing';
import { describe, expect, it, stripAnsi } from '../../-test.ts';
import { type t } from '../common.ts';
import { DevOutputLog } from '../u/u.dev.output.ts';
import { DevScreen } from '../u/u.dev.screen.ts';
import { paths, pkg, processEvent, workspace } from './u.fixture.dev-screen.ts';

type SchedulerEntry = {
  readonly run: () => void;
  canceled: boolean;
  complete: boolean;
};

describe('DevScreen runtime', () => {
  describe('session acquisition', () => {
    it('starts with one header, one spinner, and the seeded status row', () => {
      const runtime = createRuntimeHarness();
      const { reporter, spinner, prints } = runtime;

      expect(runtime.clears).to.eql(1);
      expect(prints.length).to.eql(1);
      expect(prints[0]?.phase).to.eql('startup');
      expect(stripAnsi(prints[0]?.text ?? '').startsWith('@sys/example')).to.eql(true);
      expect(spinner.starts).to.eql(1);
      expect(spinner.stops).to.eql(0);
      expect(spinner.renders).to.eql(0);
      expect(stripAnsi(spinner.text)).to.include(' 1  out  starting dev server…');

      reporter.dispose();
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

      try {
        DevScreen.create({
          pkg: pkg(),
          paths: paths(),
          url: () => 'http://localhost:1234/',
          output,
          deps: {
            clear: () => {},
            print: () => {},
            spinner: () => spinner,
          },
        });
      } catch (error) {
        thrown = error;
      }

      expect(thrown).to.equal(cause);
      expect(spinner.starts).to.eql(1);
      expect(spinner.stops).to.eql(1);
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
      expect(runtime.clears).to.eql(1);
      expect(runtime.prints.length).to.eql(1);

      reporter.dispose();
    });

    it('accepts subsequent output after synchronous scheduler completion', () => {
      const output = createOutputLog();
      const spinner = FakeSpinner.create();
      let schedules = 0;
      const reporter = DevScreen.create({
        pkg: pkg(),
        paths: paths(),
        url: () => 'http://localhost:1234/',
        output,
        deps: {
          clear: () => {},
          print: () => {},
          spinner: () => spinner,
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

    it('clear absorbs pending output and leaves a canceled callback inert', () => {
      const runtime = createRuntimeHarness();
      const { output, reporter, scheduler, spinner } = runtime;
      output.push(processEvent('stdout', 'pending output\n'));
      reporter.outputChanged();

      reporter.clearLog();

      expect(scheduler.cancels).to.eql(1);
      expect(scheduler.active).to.eql(0);
      expect(output.lines()).to.eql([]);
      expect(runtime.clears).to.eql(2);
      expect(runtime.prints.map((item) => item.phase)).to.eql(['startup', 'startup']);
      expect(spinner.starts).to.eql(2);
      expect(spinner.stops).to.eql(1);

      scheduler.force(0);
      expect(runtime.clears).to.eql(2);
      expect(runtime.prints.length).to.eql(2);
      expect(spinner.starts).to.eql(2);
      expect(spinner.stops).to.eql(1);

      reporter.dispose();
    });
  });

  describe('startup → ready', () => {
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
      expect(runtime.clears).to.eql(2);
      expect(runtime.prints.map((item) => item.phase)).to.eql(['startup', 'ready']);
      const ready = stripAnsi(runtime.prints[1]?.text ?? '');
      expect(ready).to.include(' 1  out  starting dev server…');
      expect(ready).to.include('VITE v8.1.5 ready in 10 ms');

      scheduler.force(0);
      expect(runtime.clears).to.eql(2);
      expect(runtime.prints.length).to.eql(2);
      expect(spinner.starts).to.eql(1);
      expect(spinner.stops).to.eql(1);

      reporter.dispose();
      expect(spinner.stops).to.eql(1);
    });
  });

  describe('ready phase', () => {
    it('coalesces output into one complete repaint', () => {
      const runtime = createRuntimeHarness();
      const { output, reporter, scheduler } = runtime;
      reporter.ready();
      const clears = runtime.clears;
      const prints = runtime.prints.length;

      output.push(processEvent('stdout', 'one\n'));
      reporter.outputChanged();
      output.push(processEvent('stderr', 'two\n'));
      reporter.outputChanged();

      expect(scheduler.schedules).to.eql(1);
      scheduler.flush();

      expect(runtime.clears).to.eql(clears + 1);
      expect(runtime.prints.length).to.eql(prints + 1);
      expect(runtime.prints.at(-1)?.phase).to.eql('ready');
      expect(stripAnsi(runtime.prints.at(-1)?.text ?? '')).to.include(' out  one');
      expect(stripAnsi(runtime.prints.at(-1)?.text ?? '')).to.include(' err  two');

      reporter.dispose();
    });

    it('lets an immediate presentation action absorb a pending output repaint', () => {
      const runtime = createRuntimeHarness();
      const { output, reporter, scheduler } = runtime;
      reporter.ready();

      output.push(processEvent('stdout', 'pending output\n'));
      reporter.outputChanged();
      reporter.toggleOptions();

      expect(scheduler.cancels).to.eql(1);
      expect(scheduler.active).to.eql(0);
      expect(stripAnsi(runtime.prints.at(-1)?.text ?? '')).to.include('options:');
      const prints = runtime.prints.length;

      scheduler.force(0);
      expect(runtime.prints.length).to.eql(prints);

      reporter.dispose();
    });

    it('applies options, workspace, and clear actions to complete ready frames', () => {
      const runtime = createRuntimeHarness();
      const { output, reporter } = runtime;
      reporter.ready();

      reporter.toggleOptions();
      expect(stripAnsi(runtime.prints.at(-1)?.text ?? '')).to.include('options:');

      reporter.toggleExtended(workspace());
      expect(stripAnsi(runtime.prints.at(-1)?.text ?? '')).to.include('workspace-render');

      reporter.toggleExtended(workspace());
      expect(stripAnsi(runtime.prints.at(-1)?.text ?? '')).to.not.include('workspace-render');

      reporter.clearLog();
      expect(output.lines()).to.eql([]);
      expect(runtime.prints.at(-1)?.phase).to.eql('ready');

      reporter.dispose();
    });
  });

  describe('disposal', () => {
    it('stops the spinner and remains terminal when cancellation fails', () => {
      const output = createOutputLog();
      const spinner = FakeSpinner.create();
      const cause = new Error('cancel-failed');
      let thrown: unknown;
      const reporter = DevScreen.create({
        pkg: pkg(),
        paths: paths(),
        url: () => 'http://localhost:1234/',
        output,
        deps: {
          clear: () => {},
          print: () => {},
          spinner: () => spinner,
          schedule: () => ({
            cancel: () => {
              throw cause;
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

      expect(thrown).to.equal(cause);
      expect(spinner.stops).to.eql(1);
    });

    it('is terminal with exact-once cancellation and spinner stop', () => {
      const runtime = createRuntimeHarness();
      const { output, reporter, scheduler, spinner } = runtime;
      output.push(processEvent('stdout', 'retained\n'));
      reporter.outputChanged();

      reporter.dispose();
      reporter.dispose();

      expect(scheduler.cancels).to.eql(1);
      expect(spinner.stops).to.eql(1);
      const clears = runtime.clears;
      const prints = runtime.prints.length;

      scheduler.force(0);
      reporter.outputChanged();
      reporter.ready();
      reporter.clearLog();
      reporter.toggleOptions();
      reporter.toggleExtended(workspace());

      expect(runtime.clears).to.eql(clears);
      expect(runtime.prints.length).to.eql(prints);
      expect(output.lines().map((item) => item.text)).to.eql([
        'starting dev server…',
        'retained',
      ]);
      expect(spinner.starts).to.eql(1);
      expect(spinner.stops).to.eql(1);
      expect(spinner.renders).to.eql(0);
    });
  });
});

/**
 * Helpers:
 */
function createRuntimeHarness() {
  const output = createOutputLog();
  const spinner = FakeSpinner.create();
  const scheduler = createScheduler();
  const prints: { phase: t.ViteDev.Screen.Runtime.RenderPhase; text: string }[] = [];
  let clears = 0;
  const reporter = DevScreen.create({
    pkg: pkg(),
    paths: paths(),
    url: () => 'http://localhost:1234/',
    output,
    logLines: 5,
    deps: {
      clear: () => clears += 1,
      print: (phase, text) => prints.push({ phase, text }),
      spinner: () => spinner,
      schedule: scheduler.schedule,
    },
  });

  return {
    output,
    reporter,
    scheduler,
    spinner,
    prints,
    get clears() {
      return clears;
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
