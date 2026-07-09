import { describe, expect, it, Testing } from '../../-test.ts';
import { Process } from '../mod.ts';
import { ProcessTest } from './u.fixture.ts';

const evalArgs = (code: string) => ['eval', code];

describe('Process.Port', () => {
  it('rejects invalid port targets', async () => {
    const error = await ProcessTest.catchError(() => Process.Port.listeners(0));
    expect(error?.message).to.eql('Process.Port: invalid port: 0.');
  });

  it('reports an empty listener set for a port with no TCP listener', async () => {
    const port = Testing.randomPort();

    const listeners = await Process.Port.listeners(port);

    expect(listeners).to.eql([]);
  });

  it('discovers a TCP listener without terminating it', async () => {
    const port = Testing.randomPort();
    const child = await spawnReadyServer(port);
    try {
      const listeners = await Process.Port.listeners({ port, host: '127.0.0.1' });

      expect(listeners.map((item) => item.pid)).to.eql([child.pid]);
      expect(Process.isRunning(child.pid)).to.eql(true);
    } finally {
      await cleanup(child);
    }
  });
});

async function spawnReadyServer(port: number) {
  const child = spawn(`
    Deno.serve({ hostname: '127.0.0.1', port: ${port} }, () => new Response('ok'));
    console.info('ready');
    setInterval(() => {}, 1_000);
  `);
  const reader = child.stdout.getReader();
  try {
    const { value } = await reader.read();
    expect(new TextDecoder().decode(value)).to.eql('ready\n');
  } finally {
    reader.releaseLock();
  }

  const res = await fetch(`http://127.0.0.1:${port}`);
  await res.body?.cancel();
  expect(res.status).to.eql(200);

  return child;
}

function spawn(code: string) {
  return new Deno.Command(Deno.execPath(), {
    args: evalArgs(code),
    stdin: 'null',
    stdout: 'piped',
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
