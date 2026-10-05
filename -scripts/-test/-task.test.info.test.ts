import { describe, expect, it } from '@sys/testing/server';
import { type t } from '../common.ts';
import { main } from '../task.test.info.ts';

type ProbeInput = {
  argv?: readonly string[];
  testCode?: number;
  infoCode?: number;
  run?: t.Process.Lib['inherit'];
};

type ProbeResult = {
  readonly tasks: readonly (readonly string[])[];
  readonly code: number;
};

describe('scripts/task.test.info', () => {
  it('successful tests → info; arguments stay with tests', async () => {
    const argv = ['--', '--jobs=auto'];
    expect(await probe({ argv })).to.eql({
      tasks: [['test:parallel', ...argv], ['info']],
      code: 0,
    });
  });

  it('failed tests → no info; preserve failure code', async () => {
    expect(await probe({ testCode: 7 })).to.eql({
      tasks: [['test:parallel']],
      code: 7,
    });
  });

  it('help → no info', async () => {
    for (const flag of ['--help', '-h']) {
      expect(await probe({ argv: ['--', flag] })).to.eql({
        tasks: [['test:parallel', '--', flag]],
        code: 0,
      });
    }
  });

  it('failed info → preserve failure code', async () => {
    expect(await probe({ infoCode: 9 })).to.eql({
      tasks: [['test:parallel'], ['info']],
      code: 9,
    });
  });

  it('pending tests → wait before starting info', async () => {
    const testExit = Promise.withResolvers<t.Process.InheritOutput>();
    const started: string[] = [];
    const pending = probe({
      run({ args }) {
        const task = args[1];
        started.push(task);
        return task === 'test:parallel' ? testExit.promise : Promise.resolve(status(0));
      },
    });

    try {
      await Promise.resolve();
      expect(started).to.eql(['test:parallel']);
    } finally {
      // Always release the pending process so a failed assertion cannot leak the probe.
      testExit.resolve(status(0));
      await pending;
    }
    expect(started).to.eql(['test:parallel', 'info']);
  });
});

/**
 * Helpers:
 */
async function probe(input: ProbeInput = {}): Promise<ProbeResult> {
  const tasks: string[][] = [];
  const previousExitCode = Deno.exitCode;

  try {
    await main({
      argv: input.argv ?? [],
      async run(command) {
        const { cmd, args } = command;
        expect(cmd).to.eql(Deno.execPath());
        expect(args[0]).to.eql('task');

        const task = args[1];
        if (task !== 'test:parallel' && task !== 'info') {
          throw new Error(`Unexpected task: ${task}`);
        }
        tasks.push(args.slice(1));
        if (input.run) return await input.run(command);

        const code = task === 'info' ? input.infoCode ?? 0 : input.testCode ?? 0;
        return status(code);
      },
    });

    return { tasks, code: Deno.exitCode };
  } finally {
    Deno.exitCode = previousExitCode;
  }
}

function status(code: number): t.Process.InheritOutput {
  return { code, success: code === 0, signal: null };
}
