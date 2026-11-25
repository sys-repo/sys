// Run via `deno task test:process`, with run authority scoped to Deno.
import { describe, expect, it, Time } from '../../-test.ts';
import { Process } from '../mod.ts';

type Mode = 'control' | 'listen';
const WAIT = { timeout: 5_000, interval: 10 };

if (import.meta.main) {
  await runChild(Deno.args[0] === 'control');
} else if (Deno.build.os !== 'windows') {
  describe('Process.Signal POSIX delivery', () => {
    it('same callback twice → independent disposal → native default after last removal', async () => {
      await using owned = new AsyncDisposableStack();
      const control = openChild(owned, 'control');
      await control.waitFor('READY');
      control.signal();
      const defaultStatus = await control.waitForExit();
      expect(defaultStatus.signal).to.eql('SIGTERM');

      const observed = openChild(owned, 'listen');
      await observed.waitFor('READY');
      observed.signal();
      await observed.waitFor('CALL:2');
      await observed.advance();
      await observed.waitFor('DISPOSED:1');
      observed.signal();
      await observed.waitFor('CALL:3');
      await observed.advance();
      await observed.waitFor('DISPOSED:2');
      observed.signal();
      const afterDisposal = await observed.waitForExit();
      expect(afterDisposal).to.eql(defaultStatus);
      expect(observed.calls()).to.eql(['CALL:1', 'CALL:2', 'CALL:3']);
    });
  });
}

async function runChild(control: boolean) {
  const keepAlive = setInterval(() => undefined, 1_000);
  using listeners = new DisposableStack();
  try {
    if (control) {
      console.info('READY');
    } else {
      let count = 0;
      const handler = () => console.info(`CALL:${++count}`);
      const first = attach();
      const second = attach();
      console.info('READY');
      const input = new Uint8Array(1);
      for (const [index, registration] of [first, second].entries()) {
        if (await Deno.stdin.read(input) !== 1) throw new Error('Missing disposal request.');
        registration.dispose();
        console.info(`DISPOSED:${index + 1}`);
      }

      function attach() {
        const registration = Process.Signal.on('SIGTERM', handler);
        if (registration.kind !== 'attached') throw new Error('Expected POSIX SIGTERM support.');
        listeners.defer(registration.dispose);
        return registration;
      }
    }
    await new Promise<void>(() => undefined);
  } finally {
    clearInterval(keepAlive);
  }
}

function openChild(owned: AsyncDisposableStack, mode: Mode) {
  const child = new Deno.Command(Deno.execPath(), {
    args: ['run', '--cached-only', import.meta.filename!, mode],
    stdin: 'piped',
    stdout: 'piped',
    stderr: 'inherit',
  }).spawn();
  let status: Deno.CommandStatus | undefined;
  let output = '';
  const readStatus = async () => status = await child.status;
  const drain = async () => {
    for await (const text of child.stdout.pipeThrough(new TextDecoderStream())) output += text;
  };
  const settled = Promise.all([readStatus(), drain()]);
  const waitForExit = async () => {
    const exited = await Time.waitFor(() => status, WAIT);
    if (!exited) throw new Error(`Child did not exit (${mode}): ${output}`);
    await settled;
    return exited;
  };
  owned.defer(async () => {
    try {
      if (!status) child.kill('SIGKILL');
    } catch (cause) {
      if (!(cause instanceof Deno.errors.NotFound)) throw cause;
    } finally {
      await child.stdin.close();
      await waitForExit();
    }
  });
  const lines = () => output.split(/\r?\n/).slice(0, -1);
  return {
    signal: () => child.kill('SIGTERM'),
    async advance() {
      const writer = child.stdin.getWriter();
      try {
        await writer.write(new Uint8Array([1]));
      } finally {
        writer.releaseLock();
      }
    },
    async waitFor(marker: string) {
      const found = await Time.waitFor(() => {
        if (lines().includes(marker)) return true;
        if (status) throw new Error(`Child exited before ${marker} (${mode}): ${output}`);
      }, WAIT);
      if (!found) throw new Error(`Child did not report ${marker} (${mode}): ${output}`);
    },
    waitForExit,
    calls: () => lines().filter((line) => line.startsWith('CALL:')),
  };
}
