import { spawn } from 'node:child_process';
import { kill } from 'node:process';
import { expect, Is, Time } from '../../../-test.ts';

const modes = [
  'stop-dispose',
  'stop-until',
  'stop-immediate',
  'stop-until-immediate',
  'stop-until-resolved',
  'dispose',
  'until',
  'immediate',
  'until-immediate',
  'until-resolved',
  'shared',
  'raw-first',
  'already-raw',
  'burst',
];
const cases = ['run', 'test'].flatMap((runner) => modes.map((mode) => ({ runner, mode })));

// Run proves natural exit; test additionally checks child-owned operations and resources.
for (const { runner, mode } of cases) {
  const purpose = mode.startsWith('stop-')
    ? 'stop without input'
    : mode === 'already-raw'
    ? 'preserve existing raw mode'
    : 'cancellation and sequential handoff';
  Deno.test({
    name: `Keyboard PTY: ${runner}/${mode} → ${purpose}`,
    ignore: Deno.build.os === 'windows',
    async fn() {
      const fixture = './src/m.core/m.Keyboard/-test.external/u.fixture.keyboard.pty.ts';
      const runtimeArgs = runner === 'run'
        ? ['run', '-P=test-pty', fixture, runner, mode]
        : ['test', '-P=test-pty', '--trace-leaks', fixture, '--', runner, mode];
      const args = Deno.build.os === 'darwin'
        ? ['-q', '/dev/null', Deno.execPath(), ...runtimeArgs]
        : ['-q', '-e', '-c', `exec "$KEYBOARD_DENO" ${runtimeArgs.join(' ')}`, '/dev/null'];
      const child = spawn('script', args, {
        detached: true,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...Deno.env.toObject(), KEYBOARD_DENO: Deno.execPath(), TERM: 'xterm-256color' },
      });
      let output = '';
      let failure: Error | undefined;
      let status: { code: number | null; signal: string | null } | undefined;
      let owner: number | undefined;
      const sent = new Set<string>();
      const capture = (chunk: Uint8Array) => {
        output = `${output}${new TextDecoder().decode(chunk)}`.slice(-32_000);
        const match = /KEYBOARD_OWNER:(\d+)/.exec(output);
        if (match) owner = Number(match[1]);
        for (const request of output.matchAll(/KEYBOARD_INPUT:([a-z]+)\r?\n/g)) {
          const key = request[1];
          if (!sent.has(key)) {
            sent.add(key);
            child.stdin.write(key);
          }
        }
      };
      child.stdout.on('data', capture);
      child.stderr.on('data', capture);
      child.on('error', (error) => (failure = error));
      child.once('close', (code, signal) => (status = { code, signal }));
      try {
        await Time.waitFor(() => status || failure, { interval: 20, timeout: 10_000 });
        expect(failure, output).to.eql(undefined);
        expect(status, output).to.eql({ code: 0, signal: null });
        expect(output).to.contain('KEYBOARD_CLEAN');
        if (mode.startsWith('stop-')) expect(sent.size).to.eql(0);
      } catch (cause) {
        throw new Error(`Keyboard PTY ${mode}:\n${output}`, { cause });
      } finally {
        // Only acquired invocation owners; fallback cannot satisfy the preceding assertions.
        if (!status) {
          if (owner) terminate(owner);
          if (child.pid) terminate(-child.pid);
          await Time.waitFor(() => status, { interval: 20, timeout: 3_000 });
        }
      }
    },
  });
}

function terminate(pid: number) {
  try {
    kill(pid, 'SIGKILL');
  } catch (error) {
    if (!Is.record(error) || error.code !== 'ESRCH') throw error;
  }
}
