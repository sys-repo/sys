import { describe, expect, it, Testing } from '../../-test.ts';
import { Process } from '../mod.ts';
import { ProcessTest } from './u.fixture.ts';

const evalArgs = (code: string) => ['eval', code];

describe('Process.Terminate.port', { sanitizeResources: false }, () => {
  it('rejects invalid port targets', async () => {
    const error = await ProcessTest.catchError(() => Process.Terminate.port(0));
    expect(error?.message).to.eql('Process.Port: invalid port: 0.');
  });

  it('reports a port with no TCP listener without signalling', async () => {
    const port = Testing.randomPort();

    const res = await Process.Terminate.port(port, { timeout: 0 });

    expect(res).to.eql({
      target: { protocol: 'tcp', port },
      status: 'not-listening',
      listeners: [],
      results: [],
    });
  });

  it('respects a host filter without terminating other listeners on the same port', async () => {
    const port = Testing.randomPort();
    const child = await spawnReadyServer(port);
    try {
      const res = await Process.Terminate.port({ port, host: '127.0.0.2' }, { timeout: 0 });

      expect(res.status).to.eql('not-listening');
      expect(res.listeners).to.eql([]);
      expect(res.results).to.eql([]);
      expect(Process.isRunning(child.pid)).to.eql(true);
    } finally {
      await cleanup(child);
    }
  });

  it('terminates TCP listener process ids bound to the port target', async () => {
    const port = Testing.randomPort();
    const child = await spawnReadyServer(port);
    try {
      const res = await Process.Terminate.port({ port, host: '127.0.0.1' }, { timeout: 500 });
      await child.status;

      expect(res.target).to.eql({ protocol: 'tcp', port, host: '127.0.0.1' });
      expect(res.status).to.eql('terminated');
      expect(res.listeners.map((item) => item.pid)).to.eql([child.pid]);
      expect(res.results).to.eql([{
        pid: child.pid,
        status: 'terminated',
        actions: [{ signal: 'SIGTERM', ok: true }],
      }]);
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
