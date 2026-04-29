import { describe, expect, Fs, it, type t, Testing } from '../../../-test.ts';
import { HttpStatic } from '../mod.ts';

async function close(server: t.HttpServerStarted) {
  await server.close('test.close');
  await server.finished;
}

function waitForDispose(life: t.LifecycleAsync) {
  if (life.disposed) return Promise.resolve();

  return new Promise<void>((resolve) => {
    let sub: { unsubscribe(): void } | undefined;
    sub = life.dispose$.subscribe((e) => {
      const stage = e.payload.stage;
      if (stage === 'complete' || stage === 'error') {
        sub?.unsubscribe();
        resolve();
      }
    });
  });
}

describe('HttpStatic', () => {
  it('public export resolves to the static lifecycle endpoint', async () => {
    const mod = await import('@sys/http/server/static');

    expect(mod.HttpStatic).to.equal(HttpStatic);
    expect(mod.HttpStatic.start).to.equal(HttpStatic.start);
  });

  it('starts a static server and serves index.html', async () => {
    const fs = await Testing.dir('HttpStatic');
    await Fs.write(Fs.join(fs.dir, 'index.html'), '<h1>static</h1>');

    const server = await HttpStatic.start({
      cwd: fs.dir,
      dir: '.',
      hostname: '127.0.0.1',
      port: 0,
      silent: true,
    });

    try {
      const res = await fetch(`${server.origin}/`);
      expect(res.status).to.eql(200);
      expect(res.headers.get('content-type')).to.include('text/html');
      expect(await res.text()).to.eql('<h1>static</h1>');
    } finally {
      await close(server);
    }
  });

  it('resolves relative dir against supplied cwd', async () => {
    const fs = await Testing.dir('HttpStatic');
    await Fs.write(Fs.join(fs.dir, 'public/index.html'), '<h1>relative</h1>');

    const server = await HttpStatic.start({
      cwd: fs.dir,
      dir: 'public',
      hostname: '127.0.0.1',
      port: 0,
      silent: true,
    });

    try {
      const res = await fetch(`${server.origin}/`);
      expect(res.status).to.eql(200);
      expect(await res.text()).to.eql('<h1>relative</h1>');
    } finally {
      await close(server);
    }
  });

  it('returns the standard HTTP server lifecycle handle', async () => {
    const fs = await Testing.dir('HttpStatic');
    await Fs.write(Fs.join(fs.dir, 'index.html'), '<h1>lifecycle</h1>');

    const server = await HttpStatic.start({
      cwd: fs.dir,
      dir: '.',
      port: 0,
      silent: true,
    });

    expect(server.disposed).to.eql(false);
    expect(server.origin).to.eql(`http://localhost:${server.port}`);

    await server.close('test.lifecycle');
    await server.finished;

    expect(server.disposed).to.eql(true);
    await server.dispose('test.lifecycle.again');
  });

  it('until AbortSignal closes the static server lifecycle', async () => {
    const fs = await Testing.dir('HttpStatic');
    await Fs.write(Fs.join(fs.dir, 'index.html'), '<h1>until</h1>');

    const abort = new AbortController();
    const server = await HttpStatic.start({
      cwd: fs.dir,
      dir: '.',
      port: 0,
      silent: true,
      until: abort.signal,
    });
    const disposed = waitForDispose(server);

    abort.abort('test.until');
    await disposed;
    await server.finished;

    expect(server.disposed).to.eql(true);
    expect(server.signal.aborted).to.eql(true);
  });

  it('StartArgs accepts AbortSignal through until', () => {
    const args: t.HttpStatic.StartArgs = { until: new AbortController().signal };
    expect(args.until).to.be.instanceOf(AbortSignal);
  });
});
