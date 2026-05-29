import { describe, expect, Fs, it, Str, type t, Testing } from '../../../-test.ts';
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
    expect(mod.HttpStatic.resources).to.equal(HttpStatic.resources);
    expect(mod.HttpStatic.start).to.equal(HttpStatic.start);
    expect(mod.HttpStatic.Config).to.equal(HttpStatic.Config);
  });

  it('declares configured static listener resources without starting services', async () => {
    const fs = await Testing.dir('HttpStatic.resources');
    const config = Fs.join(fs.dir, '-config/static.yaml');
    await Fs.write(
      config,
      Str.dedent(`
        name: static
        dir: .
        hostname: 127.0.0.1
        port: 4040
        silent: true
      `).trimStart(),
    );

    const resources = await HttpStatic.resources({ cwd: fs.dir, paths: { config } });

    expect(resources).to.eql([{ kind: 'tcp-listener', host: '127.0.0.1', port: 4040 }]);
  });

  it('omits static resources for ephemeral configured ports', async () => {
    const fs = await Testing.dir('HttpStatic.resources.ephemeral');
    const config = Fs.join(fs.dir, '-config/static.yaml');
    await Fs.write(
      config,
      Str.dedent(`
        name: static
        dir: .
        hostname: 127.0.0.1
        port: 0
        silent: true
      `).trimStart(),
    );

    const resources = await HttpStatic.resources({ cwd: fs.dir, paths: { config } });

    expect(resources).to.eql([]);
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

  it('exposes structured static service status', async () => {
    const fs = await Testing.dir('HttpStatic.status');
    await Fs.write(Fs.join(fs.dir, 'index.html'), '<h1>status</h1>');

    const server = await HttpStatic.start({
      cwd: fs.dir,
      dir: '.',
      hostname: '127.0.0.1',
      port: 0,
      silent: true,
      name: 'static:view',
      info: { path: '/view/', dist: 'dist/' },
    });

    try {
      expect(server.status()).to.eql({
        state: 'ready',
        kind: 'static',
        name: 'static:view',
        root: fs.dir,
        urls: [{ href: `${server.origin}/view/`, label: 'path' }],
        details: [{ label: 'dist', value: 'dist/' }],
      });
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

  it('starts from a config-ref args shape', async () => {
    const fs = await Testing.dir('HttpStatic.config-ref');
    await Fs.write(Fs.join(fs.dir, 'public/index.html'), '<h1>config-ref</h1>');
    await Fs.write(
      Fs.join(fs.dir, '-config/static.yaml'),
      'name: static\ndir: ./public\nhostname: 127.0.0.1\nport: 0\nsilent: true\n',
    );

    const server = await HttpStatic.start({
      cwd: fs.dir,
      paths: { config: Fs.join(fs.dir, '-config/static.yaml') },
    });

    try {
      expect(server.status()).to.eql({
        state: 'ready',
        kind: 'static',
        name: 'static',
        root: Fs.join(fs.dir, 'public'),
        config: Fs.join(fs.dir, '-config/static.yaml'),
        urls: [{ href: `${server.origin}/` }],
      });

      const res = await fetch(`${server.origin}/`);
      expect(res.status).to.eql(200);
      expect(await res.text()).to.eql('<h1>config-ref</h1>');
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
