import { describe, expect, it } from '../../../-test.ts';
import { Dispose, Http, type t } from '../common.ts';
import { HttpServer } from '../mod.ts';

describe('HttpServer.start', () => {
  it('app: start → req/res → close', async () => {
    const app = HttpServer.create({ static: false });
    app.get('/', (c) => c.json({ count: 123 }));

    const server = HttpServer.start(app, { silent: true, hostname: '127.0.0.1' });
    const fetch = Http.fetcher();

    try {
      type T = { count: number };
      const res = await fetch.json<T>(`${server.origin}/`);

      expect(res.status).to.eql(200);
      expect(res.data).to.eql({ count: 123 });
      expect(server.hostname).to.eql('127.0.0.1');
      expect(server.origin).to.eql(`http://localhost:${server.port}`);
      expect(server.addr.port).to.eql(server.port);
      expect(server.signal.aborted).to.eql(false);
    } finally {
      fetch.dispose();
      await server.close('test');
    }

    expect(server.disposed).to.eql(true);
    expect(server.signal.aborted).to.eql(true);
  });

  it('close/dispose are idempotent lifecycle controls', async () => {
    const app = HttpServer.create({ static: false });
    const server = HttpServer.start(app, { silent: true });
    const stages: t.DisposeAsyncStage[] = [];
    server.dispose$.subscribe((e) => stages.push(e.payload.stage));

    await server.close('first');
    await server.dispose('second');
    await server.finished;

    expect(server.disposed).to.eql(true);
    expect(stages).to.eql(['start', 'complete']);
  });

  it('wildcard bind address still reports a local origin', async () => {
    const app = HttpServer.create({ static: false });
    const server = HttpServer.start(app, { silent: true, hostname: '0.0.0.0' });

    try {
      expect(server.hostname).to.eql('0.0.0.0');
      expect(server.origin).to.eql(`http://localhost:${server.port}`);
    } finally {
      await server.close('test');
    }
  });

  it('until AbortSignal disposes the server lifecycle', async () => {
    const app = HttpServer.create({ static: false });
    const abort = new AbortController();
    const server = HttpServer.start(app, { silent: true, until: abort.signal });
    const disposed = waitForDispose(server);

    abort.abort('external');
    await disposed;

    expect(server.disposed).to.eql(true);
    expect(server.signal.aborted).to.eql(true);
  });

  it('pre-aborted until AbortSignal disposes the server lifecycle', async () => {
    const app = HttpServer.create({ static: false });
    const abort = new AbortController();
    abort.abort('external');

    const server = HttpServer.start(app, { silent: true, until: abort.signal });
    await waitForDispose(server);

    expect(server.disposed).to.eql(true);
    expect(server.signal.aborted).to.eql(true);
  });

  it('until lifecycle disposes the server lifecycle', async () => {
    const app = HttpServer.create({ static: false });
    const life = Dispose.lifecycle();
    const server = HttpServer.start(app, { silent: true, until: life });
    const disposed = waitForDispose(server);

    life.dispose('until');
    await disposed;

    expect(server.disposed).to.eql(true);
    expect(server.signal.aborted).to.eql(true);
  });
});

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
