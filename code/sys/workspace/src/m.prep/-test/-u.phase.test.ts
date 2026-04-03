import { Cli, describe, expect, it } from '../../-test.ts';
import { runPhase } from '../../u.phase.ts';

describe('Workspace.Prep.runPhase', () => {
  it('prints the done message returned by the phase callback', async () => {
    const spinner = createSpinner();

    const logs = await captureInfo(() =>
      runPhase({
        spinner,
        label: 'running phase...',
        silent: false,
        fn: async () => 'ok',
        done: (res) => `done: ${res}`,
      })
    );

    expect(spinner.events).to.eql([
      'start:running phase...',
      'stop',
    ]);
    expect(logs).to.eql(['done: ok']);
  });

  it('prints the mapped failure message when the phase throws', async () => {
    const spinner = createSpinner();

    const err = await getError(() =>
      runPhase({
        spinner,
        label: 'running phase...',
        silent: false,
        fn: async () => {
          throw new Error('boom');
        },
        fail: (error) => `failed: ${error.message}`,
      })
    );

    expect(err?.message).to.eql('boom');
    expect(spinner.events).to.eql([
      'start:running phase...',
      'fail:failed: boom',
    ]);
  });

  it('runs silently when silent is true', async () => {
    const spinner = createSpinner();

    const logs = await captureInfo(() =>
      runPhase({
        spinner,
        label: 'running phase...',
        silent: true,
        fn: async () => 'ok',
        done: () => 'done',
        fail: () => 'failed',
      })
    );

    expect(spinner.events).to.eql([]);
    expect(logs).to.eql([]);
  });

  it('clears no-summary phases without emitting blank log rows', async () => {
    const spinner = createSpinner();

    const logs = await captureInfo(() =>
      runPhase({
        spinner,
        label: 'running phase...',
        silent: false,
        fn: async () => 'ok',
      })
    );

    expect(spinner.events).to.eql([
      'start:running phase...',
      'stop',
    ]);
    expect(logs).to.eql([]);
  });
});

function createSpinner() {
  const events: string[] = [];
  return {
    events,
    text: '',
    start(text = '') {
      events.push(`start:${Cli.stripAnsi(text)}`);
      return this;
    },
    stop() {
      events.push('stop');
      return this;
    },
    succeed(text = '') {
      events.push(`succeed:${Cli.stripAnsi(text)}`);
      return this;
    },
    fail(text = '') {
      events.push(`fail:${Cli.stripAnsi(text)}`);
      return this;
    },
  };
}

async function captureInfo(fn: () => Promise<unknown>) {
  const info = console.info;
  const logs: string[] = [];
  console.info = (...args: unknown[]) => logs.push(args.map(String).join(' '));

  try {
    await fn();
  } finally {
    console.info = info;
  }

  return logs;
}

async function getError(fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (error) {
    return error as Error;
  }
}
