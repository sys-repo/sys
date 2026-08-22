import { runInNewContext } from 'node:vm';
import { Is } from '@sys/std/is';
import { describe, expect, expectTypeOf, Fs, it, type t } from '../../../-test.ts';
import { serveFileBytes } from '../mod.ts';

const encoder = new TextEncoder();

describe('serveFileBytes', () => {
  it('exports the exact constrained response contract', () => {
    expectTypeOf(serveFileBytes).toEqualTypeOf<t.HttpServer.ServeFileBytes.Method>();
  });

  it('rejects unsupported methods and Range before reading', async () => {
    for (const method of ['POST', 'PUT']) {
      let reads = 0;
      const response = await serveFileBytes({
        req: new Request('http://local/index.html', { method }),
        path: 'index.html',
        cache: 'no-store',
        read: () => {
          reads++;
          return bytes('private');
        },
      });

      expect(response.status).to.eql(405);
      expect(response.headers.get('allow')).to.eql('GET, HEAD');
      expect(reads).to.eql(0);
      await expectEmpty(response);
      expectPolicy(response);
      expectResidueAbsent(response);
    }

    let reads = 0;
    const response = await serveFileBytes({
      req: new Request('http://local/index.html', { headers: { range: 'bytes=0-' } }),
      path: 'index.html',
      cache: 'no-store',
      read: () => {
        reads++;
        return bytes('private');
      },
    });

    expect(response.status).to.eql(416);
    expect(reads).to.eql(0);
    await expectEmpty(response);
    expectPolicy(response);
    expectResidueAbsent(response);
  });

  it('emits the exact GET bytes with MIME, length, and constrained headers', async () => {
    const expected = encoder.encode('<h1>verified</h1>');
    let reads = 0;
    const response = await serveFileBytes({
      req: new Request('http://local/index.html', {
        headers: {
          'if-modified-since': new Date(0).toUTCString(),
          'if-none-match': '"stale"',
        },
      }),
      path: 'index.html',
      cache: 'no-store',
      read: () => {
        reads++;
        return Promise.resolve({ kind: 'bytes', bytes: expected });
      },
    });

    expect(response.status).to.eql(200);
    expect(reads).to.eql(1);
    expect(response.headers.get('content-type')).to.eql('text/html; charset=UTF-8');
    expect(response.headers.get('content-length')).to.eql(String(expected.byteLength));
    expect(new Uint8Array(await response.arrayBuffer())).to.eql(expected);
    expectPolicy(response);
    expectResidueAbsent(response);
  });

  it('uses the canonical standard registry and preserves source ambiguity', async () => {
    const cases = [
      ['config.yaml', 'text/yaml; charset=UTF-8'],
      ['vector.svg', 'image/svg+xml'],
      ['main.ts', 'video/mp2t'],
    ] as const;

    for (const [path, expected] of cases) {
      const response = await serveFileBytes({
        req: new Request(`http://local/${path}`),
        path,
        cache: 'no-store',
        read: () => bytes('verified'),
      });

      expect(response.status).to.eql(200);
      expect(response.headers.get('content-type')).to.eql(expected);
      expect(await response.text()).to.eql('verified');
    }
  });

  it('emits zero bytes with the binary MIME fallback', async () => {
    const response = await serveFileBytes({
      req: new Request('http://local/value.unknown'),
      path: 'value.unknown',
      cache: 'no-store',
      read: () => Promise.resolve({ kind: 'bytes', bytes: new Uint8Array() }),
    });

    expect(response.status).to.eql(200);
    expect(response.headers.get('content-type')).to.eql('application/octet-stream');
    expect(response.headers.get('content-length')).to.eql('0');
    expect(new Uint8Array(await response.arrayBuffer())).to.eql(new Uint8Array());
    expectPolicy(response);
    expectResidueAbsent(response);
  });

  it('authenticates HEAD exactly once while emitting no body', async () => {
    const expected = encoder.encode('console.info("verified");');
    let reads = 0;
    const response = await serveFileBytes({
      req: new Request('http://local/pkg/app.js', { method: 'HEAD' }),
      path: 'pkg/app.js',
      cache: 'no-store',
      read: () => {
        reads++;
        return Promise.resolve({ kind: 'bytes', bytes: expected });
      },
    });

    expect(response.status).to.eql(200);
    expect(reads).to.eql(1);
    expect(response.headers.get('content-type')).to.eql('text/javascript; charset=UTF-8');
    expect(response.headers.get('content-length')).to.eql(String(expected.byteLength));
    await expectEmpty(response);
    expectPolicy(response);
    expectResidueAbsent(response);
  });

  it('maps neutral read failures and throws to fixed empty responses', async () => {
    const cases: readonly (readonly [
      input: t.HttpServer.ServeFileBytes.Read.FailureKind | 'throw',
      status: number,
    ])[] = [
      ['missing', 404],
      ['changed', 412],
      ['cancelled', 499],
      ['failure', 500],
      ['throw', 500],
    ];

    for (const [input, status] of cases) {
      let reads = 0;
      const response = await serveFileBytes({
        req: new Request('http://local/private.txt'),
        path: 'private.txt',
        cache: 'no-store',
        read: () => {
          reads++;
          if (input === 'throw') throw new Error('/private/path checksum-secret');
          return Promise.resolve({ kind: input });
        },
      });

      expect(response.status).to.eql(status);
      expect(reads).to.eql(1);
      await expectEmpty(response);
      expectPolicy(response);
      expectResidueAbsent(response);
    }
  });

  it('maps malformed read results to an empty failure', async () => {
    const throwingKind = Object.defineProperty({}, 'kind', {
      enumerable: true,
      get: () => {
        throw new Error('/private/path checksum-secret');
      },
    });
    const accessorBytes = Object.defineProperty({ kind: 'bytes' }, 'bytes', {
      enumerable: true,
      get: () => new Uint8Array(),
    });
    const hiddenExtra = Object.defineProperty({ kind: 'missing' }, 'extra', {
      value: '/private/path',
    });
    const symbolExtra = { kind: 'missing', [Symbol('checksum-secret')]: true };
    const forgedBytes = { 0: 120, length: 1, [Symbol.toStringTag]: 'Uint8Array' };
    const forgedView = new Uint16Array([0x1234, 0x5678]);
    Object.defineProperty(forgedView, Symbol.toStringTag, { value: 'Uint8Array' });
    const proxied = new Proxy(
      { kind: 'missing' },
      {
        ownKeys: () => {
          throw new Error('/private/path checksum-secret');
        },
      },
    );
    const revoked = Proxy.revocable({ kind: 'missing' }, {});
    revoked.revoke();
    const invalid: readonly unknown[] = [
      null,
      1,
      Object.create({ kind: 'missing' }),
      { kind: 'unknown' },
      { kind: 'missing', extra: '/private/path' },
      { kind: 'bytes', bytes: 'private' },
      { kind: 'bytes', bytes: forgedBytes },
      { kind: 'bytes', bytes: forgedView },
      { kind: 'bytes', bytes: new Uint8Array(), extra: 'checksum-secret' },
      throwingKind,
      accessorBytes,
      hiddenExtra,
      symbolExtra,
      proxied,
      revoked.proxy,
    ];

    for (const input of invalid) {
      const response = await serveFileBytes({
        req: new Request('http://local/private.txt'),
        path: 'private.txt',
        cache: 'no-store',
        read: () => Promise.resolve(input) as Promise<t.HttpServer.ServeFileBytes.Read.Result>,
      });

      expect(response.status).to.eql(500);
      await expectEmpty(response);
      expectPolicy(response);
      expect(response.headers.get('content-type')).to.eql(null);
      expectResidueAbsent(response);
    }
  });

  it('contains malformed outer and request authority as fixed empty failures', async () => {
    let reads = 0;
    const valid = {
      req: new Request('http://local/private.txt'),
      path: 'private.txt',
      cache: 'no-store' as const,
      read: () => {
        reads++;
        return bytes('private');
      },
    };
    const accessor = {
      path: valid.path,
      cache: valid.cache,
      read: valid.read,
    };
    Object.defineProperty(accessor, 'req', {
      enumerable: true,
      get: () => {
        throw new Error('/private/path checksum-secret');
      },
    });
    const proxied = new Proxy(valid, {
      ownKeys: () => {
        throw new Error('/private/path checksum-secret');
      },
    });
    const revoked = Proxy.revocable(valid, {});
    revoked.revoke();
    const requestProxy = new Proxy(valid.req, {
      getPrototypeOf: () => {
        throw new Error('/private/path checksum-secret');
      },
    });
    const invalid: readonly unknown[] = [
      null,
      1,
      Object.create(valid),
      accessor,
      proxied,
      revoked.proxy,
      { ...valid, req: requestProxy },
      { ...valid, [Symbol('checksum-secret')]: true },
    ];

    for (const input of invalid) {
      const response = await serveFileBytes(input as t.HttpServer.ServeFileBytes.Args);
      expect(response.status).to.eql(500);
      await expectEmpty(response);
      expectPolicy(response);
      expectResidueAbsent(response);
    }

    expect(reads).to.eql(0);
  });

  it('admits cross-realm exact records and snapshots accepted bytes', async () => {
    const foreign = runInNewContext('({ kind: "bytes", bytes: new Uint8Array([7]) })');
    const crossRealm = await serveFileBytes({
      req: new Request('http://local/value.bin'),
      path: 'value.bin',
      cache: 'no-store',
      read: () => Promise.resolve(foreign) as Promise<t.HttpServer.ServeFileBytes.Read.Result>,
    });

    expect(crossRealm.status).to.eql(200);
    expect(new Uint8Array(await crossRealm.arrayBuffer())).to.eql(new Uint8Array([7]));

    const detached = new Uint8Array([7]);
    structuredClone(detached.buffer, { transfer: [detached.buffer] });
    const detachedResponse = await serveFileBytes({
      req: new Request('http://local/value.bin'),
      path: 'value.bin',
      cache: 'no-store',
      read: () => Promise.resolve({ kind: 'bytes', bytes: detached }),
    });

    expect(detachedResponse.status).to.eql(500);
    await expectEmpty(detachedResponse);
    expectPolicy(detachedResponse);
    expectResidueAbsent(detachedResponse);

    const mutableBytes = new Uint8Array([7]);
    const response = await serveFileBytes({
      req: new Request('http://local/value.bin'),
      path: 'value.bin',
      cache: 'no-store',
      read: () => {
        setTimeout(() => mutableBytes.fill(9));
        return Promise.resolve({ kind: 'bytes', bytes: mutableBytes });
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(new Uint8Array(await response.arrayBuffer())).to.eql(new Uint8Array([7]));
  });

  it('detaches the lazy reader and logical path before reader re-entrancy', async () => {
    let receiver: unknown;
    const mutable = {
      req: new Request('http://local/value.bin'),
      path: 'value.bin',
      cache: 'no-store' as const,
      read: function (this: unknown) {
        receiver = this;
        mutable.path = 'mutated.html';
        mutable.read = () => bytes('second');
        if (Is.object(this)) Reflect.set(this, 'path', 'mutated.html');
        return bytes('first');
      },
    };
    const args: t.HttpServer.ServeFileBytes.Args = mutable;

    const response = await serveFileBytes(args);

    expect(receiver).to.eql(undefined);
    expect(response.status).to.eql(200);
    expect(response.headers.get('content-type')).to.eql('application/octet-stream');
    expect(await response.text()).to.eql('first');
  });

  it('keeps the primitive free of filesystem, checksum, and alternate media-type kernels', async () => {
    const path = Fs.resolve(
      './src/http.server/m.HttpServer/u/u.serveFileBytes.ts',
    );
    const read = await Fs.readText(path);
    if (!read.ok) throw new Error('Failed to read constrained primitive source');
    const source = read.data ?? '';
    const forbidden = [
      '@sys/fs',
      '@sys/crypto',
      'hono/utils/mime',
      'getMimeType',
      'Deno.open',
      'Deno.lstat',
      'Deno.readFile',
      'crypto.subtle',
      'Hash.',
      'Fs.',
    ];

    for (const token of forbidden) expect(source.includes(token)).to.eql(false);
  });
});

function bytes(value: string): Promise<t.HttpServer.ServeFileBytes.Read.Result> {
  return Promise.resolve({ kind: 'bytes', bytes: encoder.encode(value) });
}

async function expectEmpty(response: Response) {
  expect(response.body).to.eql(null);
  expect(await response.text()).to.eql('');
}

function expectPolicy(response: Response) {
  expect(response.headers.get('cache-control')).to.eql('no-store');
  expect(response.headers.get('x-content-type-options')).to.eql('nosniff');
}

function expectResidueAbsent(response: Response) {
  expect(response.headers.get('access-control-allow-origin')).to.eql(null);
  expect(response.headers.get('etag')).to.eql(null);
  expect(response.headers.get('pkg')).to.eql(null);
  expect(response.headers.get('pkg-digest')).to.eql(null);
}
