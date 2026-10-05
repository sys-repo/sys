import { describe, expect, expectError, it } from '@sys/testing/server';
import { type t, Time } from '../common.ts';
import { main } from '../task.test.info.ts';

type ProbeInput = {
  argv?: readonly string[];
  testCode?: number;
  run?: t.Process.Lib['inherit'];
  info?: () => Promise<void>;
};

type ProbeResult = {
  readonly tasks: readonly (readonly string[])[];
  readonly infoCalls: number;
  readonly code: number;
};

describe('scripts/task.test.info', () => {
  it('successful tests → info; arguments stay with tests', async () => {
    const argv = ['--', '--jobs=auto'];
    const result = await probe({ argv });
    expect(result).to.eql({ tasks: [['test:parallel', ...argv]], infoCalls: 1, code: 0 });
  });

  it('failed tests → no info; preserve failure code', async () => {
    const result = await probe({ testCode: 7 });
    expect(result).to.eql({ tasks: [['test:parallel']], infoCalls: 0, code: 7 });
  });

  it('help → no info', async () => {
    for (const flag of ['--help', '-h']) {
      const argv = ['--', flag];
      const result = await probe({ argv });
      expect(result).to.eql({ tasks: [['test:parallel', ...argv]], infoCalls: 0, code: 0 });
    }
  });

  it('failed info → propagate the original error', async () => {
    const error = new Error('Info failed');
    const info = async () => {
      throw error;
    };
    const caught = await expectError(() => probe({ info }));
    expect(caught).to.equal(error);
  });

  it('pending tests → wait before starting info', async () => {
    const testExit = Promise.withResolvers<t.Process.InheritOutput>();
    const started: string[] = [];
    const run: t.Process.Lib['inherit'] = ({ args }) => {
      started.push(args[1]);
      return testExit.promise;
    };
    const info = async () => void started.push('info');
    const pending = probe({ run, info });

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

  it('pending info → await completion before returning', async () => {
    const infoExit = Promise.withResolvers<void>();
    let completed = false;
    const pending = (async () => {
      await probe({ info: () => infoExit.promise });
      completed = true;
    })();

    try {
      // Cross a timer turn so an un-awaited Info call cannot pass on microtask timing.
      await Time.wait(0);
      expect(completed).to.eql(false);
    } finally {
      infoExit.resolve();
      await pending;
    }
    expect(completed).to.eql(true);
  });
});

/**
 * Helpers:
 */
async function probe(input: ProbeInput = {}): Promise<ProbeResult> {
  const tasks: string[][] = [];
  let infoCalls = 0;
  const previousExitCode = Deno.exitCode;

  const argv = input.argv ?? [];
  const run: t.Process.Lib['inherit'] = async (command) => {
    const { cmd, args } = command;
    expect(cmd).to.eql(Deno.execPath());
    expect(args.slice(0, 2)).to.eql(['task', 'test:parallel']);
    tasks.push(args.slice(1));
    return input.run ? await input.run(command) : status(input.testCode ?? 0);
  };
  const info = async () => {
    infoCalls += 1;
    await input.info?.();
  };

  try {
    await main({ argv, run, info });
    return { tasks, infoCalls, code: Deno.exitCode };
  } finally {
    Deno.exitCode = previousExitCode;
  }
}

function status(code: number): t.Process.InheritOutput {
  return { code, success: code === 0, signal: null };
}
