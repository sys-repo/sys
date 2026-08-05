import { describe, expect, it } from '../../-test.ts';
import { Process } from '../mod.ts';

const evalArgs = (code: string) => ['eval', code];

describe('Process.Terminate', { sanitizeResources: false }, () => {
  it('isRunning → reports the current process', () => {
    expect(Process.isRunning(Deno.pid)).to.eql(true);
  });

  it('pid → reports an absent pid without signalling', async () => {
    const res = await Process.Terminate.pid(999_999_999, { timeout: 0 });

    expect(res).to.eql({
      pid: 999_999_999,
      status: 'not-running',
      actions: [],
    });
  });

  it('pid → gracefully terminates a running process', async () => {
    const child = spawnEval('setInterval(() => {}, 1_000);');
    try {
      expect(Process.isRunning(child.pid)).to.eql(true);

      const res = await Process.Terminate.pid(child.pid, { timeout: 500 });
      await child.status;

      expect(res.pid).to.eql(child.pid);
      expect(res.status).to.eql('terminated');
      expect(res.actions).to.eql([{ signal: 'SIGTERM', ok: true }]);
    } finally {
      await cleanup(child);
    }
  });

  it('pid → escalates when SIGTERM is ignored', async () => {
    const child = await spawnReadyEval(`
      Deno.addSignalListener('SIGTERM', () => undefined);
      console.info('ready');
      setInterval(() => {}, 1_000);
    `);
    try {
      const res = await Process.Terminate.pid(child.pid, { timeout: 50 });
      await child.status;

      expect(res.pid).to.eql(child.pid);
      expect(res.status).to.eql('killed');
      expect(res.actions).to.eql([
        { signal: 'SIGTERM', ok: true },
        { signal: 'SIGKILL', ok: true },
      ]);
    } finally {
      await cleanup(child);
    }
  });
});

function spawnEval(code: string) {
  return spawn(code, 'null');
}

async function spawnReadyEval(code: string) {
  const child = spawn(code, 'piped');
  const reader = child.stdout.getReader();
  try {
    const { value } = await reader.read();
    expect(new TextDecoder().decode(value)).to.eql('ready\n');
    return child;
  } finally {
    reader.releaseLock();
  }
}

function spawn(code: string, stdout: Deno.CommandOptions['stdout']) {
  return new Deno.Command(Deno.execPath(), {
    args: evalArgs(code),
    stdin: 'null',
    stdout,
    stderr: 'null',
  }).spawn();
}

async function cleanup(child: Deno.ChildProcess) {
  try {
    if (Process.isRunning(child.pid)) Deno.kill(child.pid, 'SIGKILL');
  } catch {
    // Ignore best-effort cleanup failures in the test finalizer.
  }

  try {
    await child.status;
  } catch {
    // Ignore child status races after forced cleanup.
  }
}
