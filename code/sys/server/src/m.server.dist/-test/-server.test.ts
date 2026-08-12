import { Hash } from '@sys/crypto/hash';
import { describe, expect, Fs, it, Json, type t, Time } from '../../-test.ts';
import { Dist, DistServer } from '../mod.ts';
import { setup, teardown } from './u.fixture.ts';

describe('DistServer', () => {
  it('freezes its runtime surfaces', () => {
    expect(Object.isFrozen(DistServer)).to.eql(true);
    expect(Object.isFrozen(DistServer.Error)).to.eql(true);
  });

  it('refuses a missing generation with one typed sanitized failure', async () => {
    const fixture = await setup();
    try {
      const error = await catchStart(() => {
        return DistServer.start({
          dir: `${fixture.storeDir}/missing` as t.StringDir,
          integrity: fixture.integrity,
          limits: fixture.policy.verification,
          silent: true,
        });
      });

      expect(DistServer.Error.is(error)).to.eql(true);
      expect(error?.name).to.eql('DistServer.StartError');
      expect(error?.reason).to.eql('missing');
      expect(error?.message).to.eql('DistServer.start: pinned generation is unavailable.');
      expect(JSON.stringify(error)).to.not.include(fixture.storeDir);
      expect(JSON.stringify(error)).to.not.include(fixture.integrity);
      expect(Object.isFrozen(error)).to.eql(true);
    } finally {
      await teardown(fixture);
    }
  });

  it('requires a fresh successful start after an initially missing generation', async () => {
    const fixture = await setup();
    let server: t.HttpServer.Started | undefined;
    try {
      const missing = await catchStart(() => {
        return DistServer.start({
          dir: Fs.join(fixture.storeDir, 'missing') as t.StringDir,
          integrity: fixture.integrity,
          limits: fixture.policy.verification,
          silent: true,
        });
      });
      expect(missing?.reason).to.eql('missing');

      const materialized = await Dist.materialize(fixture.args());
      expect(materialized.kind).to.eql('promoted');
      if (materialized.kind !== 'promoted') return;

      server = await DistServer.start({
        dir: materialized.dir,
        integrity: materialized.integrity,
        limits: fixture.policy.verification,
        silent: true,
      });
      const response = await fetch(server.origin);
      expect(response.status).to.eql(200);
      expect(await response.text()).to.eql('<h1>verified</h1>');
    } finally {
      await server?.close('test.cleanup');
      await teardown(fixture);
    }
  });

  it('rejects authenticated malformed and legacy manifests before listener startup', async () => {
    const fixture = await setup();
    try {
      const materialized = await Dist.materialize(fixture.args());
      expect(materialized.kind).to.eql('promoted');
      if (materialized.kind !== 'promoted') return;

      const encoder = new TextEncoder();
      const legacy = {
        type: 'https://jsr.io/@sys/types/0.0.100/src/types/t.Pkg.dist.ts',
        pkg: { name: '@sample/legacy', version: '0.0.1' },
        build: {
          time: 1_746_520_471_244,
          size: { total: 1, pkg: 1 },
          builder: '@sample/legacy@0.0.1',
          runtime: '<runtime-uri>',
        },
        hash: { digest: 'sha256-deadbeef', parts: { './index.js': 'sha256-deadbeef' } },
      };
      const cases = [
        ['malformed', encoder.encode('{')],
        ['legacy', encoder.encode(Json.stringify(legacy))],
      ] as const;

      for (const [label, bytes] of cases) {
        await Fs.write(Fs.join(materialized.dir, 'dist.json'), bytes);
        const error = await catchStart(() => {
          return DistServer.start({
            dir: materialized.dir,
            integrity: Hash.sha256(bytes),
            limits: fixture.policy.verification,
            silent: true,
          });
        });
        expect([label, error?.reason]).to.eql([label, 'malformed']);
        expect(error?.message).to.eql('DistServer.start: pinned generation verification failed.');
        expect(JSON.stringify(error)).to.not.include(materialized.dir);
      }
    } finally {
      await teardown(fixture);
    }
  });

  it('serves declared assets from freshly verified authority', async () => {
    const fixture = await setup();
    let server: t.DistServer.Started | undefined;
    try {
      const materialized = await Dist.materialize(fixture.args());
      expect(materialized.kind).to.eql('promoted');
      if (materialized.kind !== 'promoted') return;

      server = await DistServer.start({
        dir: materialized.dir,
        integrity: materialized.integrity,
        limits: fixture.policy.verification,
        silent: true,
      });

      expect(server.authority).to.eql({
        kind: 'pinned',
        integrity: materialized.integrity,
      });
      expect(server.verification).to.eql(materialized.verification);
      expect(Object.isFrozen(server.authority)).to.eql(true);
      expect(Object.isFrozen(server.verification)).to.eql(true);

      const index = await fetch(server.origin);
      expect(index.status).to.eql(200);
      expect(await index.text()).to.eql('<h1>verified</h1>');
      expect(index.headers.get('content-type')).to.eql('text/html; charset=UTF-8');
      expect(index.headers.get('cache-control')).to.eql('no-store');
      expect(index.headers.get('x-content-type-options')).to.eql('nosniff');
      expect(index.headers.get('access-control-allow-origin')).to.eql(null);
      expect(index.headers.get('pkg')).to.eql(null);
      expect(index.headers.get('pkg-digest')).to.eql(null);

      const script = await fetch(`${server.origin}/assets/app.js`);
      expect(script.status).to.eql(200);
      expect(await script.text()).to.eql('console.info("verified");');
      expect(script.headers.get('content-type')).to.eql('text/javascript; charset=UTF-8');

      const manifest = await fetch(`${server.origin}/dist.json`);
      expect(manifest.status).to.eql(404);
      await manifest.body?.cancel();
    } finally {
      await server?.close('test.cleanup');
      await teardown(fixture);
    }
  });

  it('preserves constrained HTTP admission and canonical path behavior', async () => {
    const fixture = await setup();
    let server: t.HttpServer.Started | undefined;
    try {
      const started = await startFixture(fixture);
      server = started.server;

      const post = await fetch(`${server.origin}/assets/app.js`, { method: 'POST' });
      expect(post.status).to.eql(405);
      expect(post.headers.get('allow')).to.eql('GET, HEAD');
      await post.body?.cancel();

      const range = await fetch(`${server.origin}/assets/app.js`, {
        headers: { range: 'bytes=0-1' },
      });
      expect(range.status).to.eql(416);
      await range.body?.cancel();

      const head = await fetch(`${server.origin}/assets/app.js`, { method: 'HEAD' });
      expect(head.status).to.eql(200);
      expect(head.body).to.eql(null);
      expect(head.headers.get('content-length')).to.eql(
        String(new TextEncoder().encode('console.info("verified");').byteLength),
      );

      const conditional = await fetch(`${server.origin}/assets/app.js`, {
        headers: { 'if-none-match': '*' },
      });
      expect(conditional.status).to.eql(200);
      expect(conditional.headers.get('etag')).to.eql(null);
      await conditional.body?.cancel();

      const encoded = await fetch(`${server.origin}/assets/data%20%231.txt?ignored=dist.json`);
      expect(encoded.status).to.eql(200);
      expect(await encoded.text()).to.eql('encoded path');

      const queryBackslash = await server.app.request(
        new Request(`http://local.invalid/assets/app.js?ignored=\\`, {
          headers: { host: `localhost:${server.port}` },
        }),
      );
      expect(queryBackslash.status).to.eql(200);
      expect(await queryBackslash.text()).to.eql('console.info("verified");');

      for (
        const path of [
          '/assets//app.js',
          '/assets/',
          '/assets%2Fapp.js',
          '/assets%5Capp.js',
          '/assets/%ZZ',
        ]
      ) {
        const response = await fetch(`${server.origin}${path}`);
        expect([path, response.status]).to.eql([path, 404]);
        await response.body?.cancel();
      }

      expect(await rawStatus(server, '/assets/%2e')).to.eql(404);
      expect(await rawStatus(server, '/assets/%2e%2e')).to.eql(200);
    } finally {
      await server?.close('test.cleanup');
      await teardown(fixture);
    }
  });

  it('rejects absent, malformed, rebinding, and wrong-port Host authority', async () => {
    const fixture = await setup();
    let server: t.HttpServer.Started | undefined;
    try {
      const started = await startFixture(fixture);
      server = started.server;

      const absent = await server.app.request(new Request('http://local.invalid/'));
      expect(absent.status).to.eql(421);

      for (
        const host of [
          'evil.test',
          '0.0.0.0',
          `0.0.0.0:${server.port}`,
          `[::]:${server.port}`,
          `localhost:${server.port},evil.test`,
          `localhost:${server.port + 1}`,
          `127.0.0.1:${server.port + 1}`,
        ]
      ) {
        const response = await server.app.request(
          new Request('http://local.invalid/', { headers: { host } }),
        );
        expect(response.status).to.eql(421);
      }

      const admitted = new Set([
        `localhost:${server.port}`,
        hostAuthority(server.hostname, server.port),
        hostAuthority(server.addr.hostname, server.port),
      ]);
      for (const host of admitted) {
        const loopback = await server.app.request(
          new Request('http://local.invalid/', { headers: { host } }),
        );
        expect([host, loopback.status]).to.eql([host, 200]);
        expect(await loopback.text()).to.eql('<h1>verified</h1>');
      }
    } finally {
      await server?.close('test.cleanup');
      await teardown(fixture);
    }
  });

  it('fails closed when declared bytes change and ignores incidental files', async () => {
    const fixture = await setup();
    let server: t.HttpServer.Started | undefined;
    try {
      const started = await startFixture(fixture);
      server = started.server;

      for (const path of ['incidental.txt', 'dist.json.sig', 'receipt.json']) {
        await Fs.write(Fs.join(started.dir, path), 'not declared');
      }
      await Fs.ensureDir(Fs.join(started.dir, 'undeclared'));
      await Fs.write(Fs.join(started.dir, 'undeclared/index.html'), 'not declared');

      for (
        const path of ['incidental.txt', 'dist.json.sig', 'receipt.json', 'undeclared/index.html']
      ) {
        const response = await fetch(`${server.origin}/${path}`);
        expect([path, response.status]).to.eql([path, 404]);
        await response.body?.cancel();
      }

      await Fs.remove(Fs.join(started.dir, 'assets/app.js'));
      const missing = await fetch(`${server.origin}/assets/app.js`);
      expect(missing.status).to.eql(404);
      await missing.body?.cancel();

      await Fs.write(Fs.join(started.dir, 'index.html'), '<h1>tampered</h1>');
      const changed = await fetch(server.origin);
      expect(changed.status).to.eql(412);
      expect((await changed.arrayBuffer()).byteLength).to.eql(0);
    } finally {
      await server?.close('test.cleanup');
      await teardown(fixture);
    }
  });

  it('rejects the wrong manifest pin before listener startup', async () => {
    const fixture = await setup();
    try {
      const materialized = await Dist.materialize(fixture.args());
      expect(materialized.kind).to.eql('promoted');
      if (materialized.kind !== 'promoted') return;

      const error = await catchStart(() => {
        return DistServer.start({
          dir: materialized.dir,
          integrity: `sha256-${'f'.repeat(64)}` as t.StringHash,
          limits: fixture.policy.verification,
          silent: true,
        });
      });
      expect(error?.reason).to.eql('integrity-mismatch');
      expect(error?.message).to.eql('DistServer.start: pinned generation verification failed.');
      expect(JSON.stringify(error)).to.not.include(materialized.dir);
      expect(JSON.stringify(error)).to.not.include(materialized.integrity);
    } finally {
      await teardown(fixture);
    }
  });

  it('closes through caller and returned lifecycle authority', async () => {
    const fixture = await setup();
    const controller = new AbortController();
    let server: t.HttpServer.Started | undefined;
    try {
      const materialized = await Dist.materialize(fixture.args());
      expect(materialized.kind).to.eql('promoted');
      if (materialized.kind !== 'promoted') return;

      server = await DistServer.start({
        dir: materialized.dir,
        integrity: materialized.integrity,
        limits: fixture.policy.verification,
        silent: true,
        until: controller.signal,
      });
      controller.abort('operator.stop');
      await server.finished;
      await Time.wait(0);
      expect(server.disposed).to.eql(true);
      expect(server.signal.aborted).to.eql(true);

      server = await DistServer.start({
        dir: materialized.dir,
        integrity: materialized.integrity,
        limits: fixture.policy.verification,
        silent: true,
      });
      await server.close('operator.close');
      await server.finished;
      expect(server.disposed).to.eql(true);
      expect(server.signal.aborted).to.eql(true);
    } finally {
      await server?.close('test.cleanup');
      await teardown(fixture);
    }
  });

  it('classifies an occupied listener without exposing its host cause', async () => {
    const fixture = await setup();
    const blocker = Deno.listen({ hostname: '127.0.0.1', port: 0 });
    try {
      const materialized = await Dist.materialize(fixture.args());
      expect(materialized.kind).to.eql('promoted');
      if (materialized.kind !== 'promoted') return;

      const error = await catchStart(() => {
        return DistServer.start({
          dir: materialized.dir,
          integrity: materialized.integrity,
          limits: fixture.policy.verification,
          hostname: '127.0.0.1',
          port: (blocker.addr as Deno.NetAddr).port as t.PortNumber,
          silent: true,
        });
      });
      expect(DistServer.Error.is(error)).to.eql(true);
      expect(error?.reason).to.eql('address-in-use');
      expect(error?.message).to.eql('DistServer.start: address is unavailable.');
      expect(error).to.not.have.property('cause');
    } finally {
      blocker.close();
      await teardown(fixture);
    }
  });
});

type StartedFixture = {
  readonly server: t.HttpServer.Started;
  readonly dir: t.StringDir;
};

async function startFixture(fixture: Awaited<ReturnType<typeof setup>>): Promise<StartedFixture> {
  const materialized = await Dist.materialize(fixture.args());
  expect(materialized.kind).to.eql('promoted');
  if (materialized.kind !== 'promoted') throw new Error('Expected promoted Dist fixture.');

  const server = await DistServer.start({
    dir: materialized.dir,
    integrity: materialized.integrity,
    limits: fixture.policy.verification,
    silent: true,
  });
  return { server, dir: materialized.dir };
}

async function rawStatus(server: t.HttpServer.Started, target: string): Promise<number> {
  const connection = await Deno.connect({ hostname: '127.0.0.1', port: server.port });
  try {
    const request = new TextEncoder().encode(
      `GET ${target} HTTP/1.1\r\nHost: localhost:${server.port}\r\nConnection: close\r\n\r\n`,
    );
    await connection.write(request);
    const bytes = new Uint8Array(1024);
    const decoder = new TextDecoder();
    let length = 0;
    let text = '';
    while (length < bytes.byteLength && !text.includes('\r\n')) {
      const count = await connection.read(bytes.subarray(length));
      if (count === null) break;
      length += count;
      text = decoder.decode(bytes.subarray(0, length));
    }
    if (!text.includes('\r\n')) throw new Error('Expected complete HTTP status line.');

    const line = text.split('\r\n')[0];
    const status = Number(line.split(' ')[1]);
    if (!Number.isInteger(status)) throw new Error('Expected HTTP status line.');
    return status;
  } finally {
    connection.close();
  }
}

function hostAuthority(hostname: string, port: number): string {
  const host = hostname.includes(':') ? `[${hostname}]` : hostname;
  return `${host}:${port}`;
}

async function catchStart(
  fn: () => Promise<unknown>,
): Promise<t.DistServer.StartError | undefined> {
  try {
    await fn();
  } catch (cause) {
    return cause as t.DistServer.StartError;
  }
}
