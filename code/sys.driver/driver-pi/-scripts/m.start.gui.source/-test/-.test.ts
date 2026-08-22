import { describe, expect, Fs, FsDist, it, Json, type t } from '../../common.ts';
import { pkg } from '../../../src/pkg.ts';
import { loadGuiDistSource, type SourceStartDependencies, startGuiDistSourceWith } from '../mod.ts';

const ORIGIN = 'http://localhost:8080';
const INDEX = '<!doctype html><title>Driver Pi</title>';
const SCRIPT = 'console.info("driver-pi");';
const SPACE = 'space asset';
const UNICODE = '東京';
const PERCENT = 'literal percent';
const PACKAGE_ROOT: t.StringAbsoluteDir = Fs.resolve(import.meta.dirname ?? '.', '../../..');

describe('driver-pi/scripts/task.start.gui.source', () => {
  it('keeps the runtime capability narrower than its explicit real-process proof', async () => {
    type Config = Readonly<{
      tasks: Readonly<Record<string, string>>;
      permissions: Readonly<Record<string, unknown>>;
    }>;
    const config = (await Fs.readJson<Config>(Fs.join(PACKAGE_ROOT, 'deno.json'))).data;
    if (!config) throw new Error('Expected Driver Pi package configuration.');

    expect(config.permissions.source).to.eql({
      read: ['./dist'],
      net: ['127.0.0.1:8080'],
    });
    expect(config.permissions['source-process']).to.eql({
      read: ['./dist'],
      net: ['localhost:8080', '127.0.0.1:8080'],
      run: ['deno'],
    });
    expect(config.tasks.test.includes('test:source:process')).to.eql(false);
  });
  it('serves exact saved manifest and declared-part bytes for GET and HEAD', async () => {
    const fixture = await sourceFixture();
    try {
      const source = await loadGuiDistSource(fixture.dir);
      const manifest = await source.fetch(request('/dist.json'));
      expect(manifest.status).to.eql(200);
      expect(new Uint8Array(await manifest.arrayBuffer())).to.eql(fixture.manifest);

      const manifestHead = await source.fetch(request('/dist.json', 'HEAD'));
      expect(manifestHead.status).to.eql(200);
      expect(manifestHead.headers.get('content-length')).to.eql(
        String(fixture.manifest.byteLength),
      );
      expect(new Uint8Array(await manifestHead.arrayBuffer())).to.eql(new Uint8Array());

      for (const [path, expected] of fixture.parts) {
        const get = await source.fetch(request(path));
        expect(get.status).to.eql(200);
        expect(new Uint8Array(await get.arrayBuffer())).to.eql(expected);

        const head = await source.fetch(request(path, 'HEAD'));
        expect(head.status).to.eql(200);
        expect(head.headers.get('content-length')).to.eql(String(expected.byteLength));
        expect(new Uint8Array(await head.arrayBuffer())).to.eql(new Uint8Array());
      }
    } finally {
      await fixture.dispose();
    }
  });

  it('uses normalized request routes and refuses surviving unadmitted requests', async () => {
    const fixture = await sourceFixture();
    try {
      const source = await loadGuiDistSource(fixture.dir);
      const alias = await source.fetch(new Request(`${ORIGIN}/pkg/../index.html`));
      expect(alias.status).to.eql(200);
      expect(await alias.text()).to.eql(INDEX);

      for (
        const url of [
          `${ORIGIN}/`,
          `${ORIGIN}/missing.js`,
          `${ORIGIN}/pkg%2Fentry.js`,
          `${ORIGIN}/pkg%5Centry.js`,
          `${ORIGIN}/literal%2Fname.js`,
          `${ORIGIN}/dist.json?mutable=true`,
          'http://127.0.0.1:8080/dist.json',
        ]
      ) {
        const response = await source.fetch(new Request(url));
        expect(response.status).to.eql(404);
        expect(await response.text()).to.eql('');
        expect(response.headers.get('cache-control')).to.eql('no-store');
        expect(response.headers.get('x-content-type-options')).to.eql('nosniff');
      }
    } finally {
      await fixture.dispose();
    }
  });

  it('applies fixed method and range policy to admitted routes', async () => {
    const fixture = await sourceFixture();
    try {
      const source = await loadGuiDistSource(fixture.dir);
      const post = await source.fetch(request('/dist.json', 'POST'));
      expect(post.status).to.eql(405);
      expect(post.headers.get('allow')).to.eql('GET, HEAD');
      expect(await post.text()).to.eql('');

      const range = await source.fetch(
        new Request(`${ORIGIN}/index.html`, { headers: { range: 'bytes=0-1' } }),
      );
      expect(range.status).to.eql(416);
      expect(await range.text()).to.eql('');
    } finally {
      await fixture.dispose();
    }
  });

  it('fails for missing or malformed manifests without producing a build', async () => {
    const fixture = await sourceFixture();
    const missing: t.StringAbsoluteDir = Fs.join(fixture.root, 'missing');
    try {
      const missingError = await rejectionOf(() => loadGuiDistSource(missing));
      expect(missingError.message).to.eql('Driver Pi GUI Dist source is missing dist.json.');

      await Fs.write(Fs.join(fixture.dir, 'dist.json'), '{"hash":{"parts":{}}}');
      const malformedError = await rejectionOf(() => loadGuiDistSource(fixture.dir));
      expect(malformedError.message).to.eql('Driver Pi GUI Dist source manifest is malformed.');
      expect(await Fs.exists(missing)).to.eql(false);
    } finally {
      await fixture.dispose();
    }
  });

  it('rejects a symlinked source manifest without reading its target', async () => {
    const fixture = await sourceFixture();
    try {
      const manifestPath = Fs.join(fixture.dir, 'dist.json');
      const outside = Fs.join(fixture.root, 'outside-manifest.json');
      await Fs.write(outside, fixture.manifest);
      await Fs.remove(manifestPath);
      await Deno.symlink(outside, manifestPath);

      const failure = await rejectionOf(() => loadGuiDistSource(fixture.dir));
      expect(failure.message).to.eql('Driver Pi GUI Dist source manifest path is unsafe.');
    } finally {
      await fixture.dispose();
    }
  });

  it('rejects unsafe or structurally ambiguous manifest path batches at startup', async () => {
    const fixture = await sourceFixture();
    const unsafe = [
      ['pkg//entry.js'],
      ['assets/'],
      ['asset.'],
      ['CON'],
      ['docs\\entry.js'],
      ['./index.html'],
      ['dist.json'],
      ['pkg', 'pkg/entry.js'],
    ] as const;

    try {
      for (const paths of unsafe) {
        await replaceManifestParts(fixture, paths);
        const error = await rejectionOf(() => loadGuiDistSource(fixture.dir));
        expect(error.message).to.eql(
          'Driver Pi GUI Dist source manifest contains an unsafe route.',
        );
      }
    } finally {
      await fixture.dispose();
    }
  });

  it('rejects a declared filesystem alias of the manifest identity', async () => {
    const fixture = await sourceFixture();
    try {
      await replaceManifestParts(fixture, ['manifest-alias.json']);
      await Deno.link(
        Fs.join(fixture.dir, 'dist.json'),
        Fs.join(fixture.dir, 'manifest-alias.json'),
      );
      const failure = await rejectionOf(() => loadGuiDistSource(fixture.dir));
      expect(failure.message).to.eql(
        'Driver Pi GUI Dist source manifest contains an unsafe route.',
      );
    } finally {
      await fixture.dispose();
    }
  });

  it('refuses missing parts and leaves changed-byte integrity to the consumer', async () => {
    const fixture = await sourceFixture();
    try {
      const source = await loadGuiDistSource(fixture.dir);
      await Fs.remove(Fs.join(fixture.dir, 'index.html'));
      const missing = await source.fetch(request('/index.html'));
      expect(missing.status).to.eql(404);
      expect(await missing.text()).to.eql('');

      await Fs.write(Fs.join(fixture.dir, 'pkg/entry.js'), 'changed');
      const changed = await source.fetch(request('/pkg/entry.js'));
      expect(changed.status).to.eql(200);
      expect(await changed.text()).to.eql('changed');
    } finally {
      await fixture.dispose();
    }
  });

  it('retains request-time confinement across symlink and root replacement', async () => {
    const fixture = await sourceFixture();
    try {
      const source = await loadGuiDistSource(fixture.dir);
      const privatePath = Fs.join(fixture.dir, 'private.txt');
      await Fs.write(privatePath, 'private');
      await Fs.remove(Fs.join(fixture.dir, 'index.html'));
      await Deno.symlink(privatePath, Fs.join(fixture.dir, 'index.html'));

      const linked = await source.fetch(request('/index.html'));
      expect(linked.status).to.eql(500);
      expect(await linked.text()).to.eql('');

      const moved = Fs.join(fixture.root, 'moved-dist');
      await Deno.rename(fixture.dir, moved);
      await Fs.ensureDir(Fs.join(fixture.dir, 'pkg'));
      await Fs.write(Fs.join(fixture.dir, 'pkg/entry.js'), 'replacement-private');
      const replaced = await source.fetch(request('/pkg/entry.js'));
      expect(replaced.status).to.eql(500);
      expect(await replaced.text()).to.eql('');
    } finally {
      await fixture.dispose();
    }
  });

  it('requires every declared regular-file part at startup', async () => {
    const fixture = await sourceFixture();
    try {
      await Fs.remove(Fs.join(fixture.dir, 'index.html'));
      const missing = await rejectionOf(() => loadGuiDistSource(fixture.dir));
      expect(missing.message).to.eql('Driver Pi GUI Dist source is missing a declared part.');
    } finally {
      await fixture.dispose();
    }
  });

  it('owns one fixed listener, truthful quit control, and close completion', async () => {
    const fixture = await sourceFixture();
    try {
      const source = await loadGuiDistSource(fixture.dir);
      const serverFinished = Promise.withResolvers<void>();
      const keyboardFinished = Promise.withResolvers<void>();
      const addr: Deno.NetAddr = {
        hostname: '127.0.0.1',
        port: 8080,
        transport: 'tcp',
      };
      let serveOptions: Parameters<SourceStartDependencies['serve']>[0] | undefined;
      let keyboardOptions: Parameters<SourceStartDependencies['bindKeyboard']>[0] | undefined;
      let printed: { dir: t.StringAbsoluteDir; manifest: t.StringUrl; quit: string } | undefined;
      let interruptDisposals = 0;
      let keyboardDisposals = 0;

      const started = await startGuiDistSourceWith(source, {
        serve(options) {
          serveOptions = options;
          options.onListen(addr);
          options.signal.addEventListener('abort', () => serverFinished.resolve(), { once: true });
          return { addr, finished: serverFinished.promise };
        },
        bindInterrupt() {
          return {
            dispose() {
              interruptDisposals += 1;
            },
          };
        },
        bindKeyboard(options) {
          keyboardOptions = options;
          return {
            dispose() {
              keyboardDisposals += 1;
              keyboardFinished.resolve();
            },
            finished: keyboardFinished.promise,
          };
        },
        async shutdownKeyboard(handle) {
          handle.dispose();
          await handle.finished;
        },
        print(input) {
          printed = input;
        },
      });

      expect({ hostname: serveOptions?.hostname, port: serveOptions?.port }).to.eql({
        hostname: '127.0.0.1',
        port: 8080,
      });
      expect(Object.keys(started).sort()).to.eql([
        'addr',
        'close',
        'finished',
        'hostname',
        'origin',
        'port',
      ]);
      expect(started.addr).to.eql(addr);
      expect(started.hostname).to.eql('127.0.0.1');
      expect(started.port).to.eql(8080);
      expect(started.origin).to.eql(ORIGIN);
      expect(keyboardOptions?.onKey).to.eql(undefined);
      expect(printed).to.eql({
        dir: fixture.dir,
        manifest: `${ORIGIN}/dist.json`,
        quit: 'Ctrl+C or Q',
      });

      expect(await keyboardOptions?.onQuit()).to.eql(undefined);
      const closing = started.close();
      expect(started.close()).to.equal(closing);
      await closing;
      expect(interruptDisposals).to.eql(1);
      expect(keyboardDisposals).to.eql(1);
    } finally {
      await fixture.dispose();
    }
  });

  it('accepts the owned interrupt path without granting a second listener owner', async () => {
    const fixture = await sourceFixture();
    try {
      const source = await loadGuiDistSource(fixture.dir);
      const serverFinished = Promise.withResolvers<void>();
      const addr: Deno.NetAddr = {
        hostname: '127.0.0.1',
        port: 8080,
        transport: 'tcp',
      };
      let interrupt: (() => void) | undefined;
      let printedQuit = '';

      const started = await startGuiDistSourceWith(source, {
        serve(options) {
          options.onListen(addr);
          options.signal.addEventListener('abort', () => serverFinished.resolve(), { once: true });
          return { addr, finished: serverFinished.promise };
        },
        bindInterrupt(onInterrupt) {
          interrupt = onInterrupt;
          return { dispose() {} };
        },
        bindKeyboard() {
          return undefined;
        },
        shutdownKeyboard() {
          return Promise.resolve();
        },
        print(input) {
          printedQuit = input.quit;
        },
      });

      expect(printedQuit).to.eql('Ctrl+C');
      interrupt?.();
      await started.finished;
    } finally {
      await fixture.dispose();
    }
  });

  it('preserves listener and keyboard-cleanup failures in first-failure order', async () => {
    const fixture = await sourceFixture();
    try {
      const source = await loadGuiDistSource(fixture.dir);
      const serverFinished = Promise.withResolvers<void>();
      const keyboardFinished = Promise.withResolvers<void>();
      const serverFailure = new Error('listener failed');
      const cleanupFailure = new Error('keyboard cleanup failed');
      const addr: Deno.NetAddr = {
        hostname: '127.0.0.1',
        port: 8080,
        transport: 'tcp',
      };

      const started = await startGuiDistSourceWith(source, {
        serve(options) {
          options.onListen(addr);
          return { addr, finished: serverFinished.promise };
        },
        bindInterrupt() {
          return { dispose() {} };
        },
        bindKeyboard() {
          return {
            dispose() {
              keyboardFinished.reject(cleanupFailure);
            },
            finished: keyboardFinished.promise,
          };
        },
        async shutdownKeyboard(handle) {
          handle.dispose();
          await handle.finished;
        },
        print() {},
      });

      serverFinished.reject(serverFailure);
      const failure = await rejectionOf(() => started.finished);
      expect(failure).to.be.instanceOf(AggregateError);
      expect((failure as AggregateError).errors).to.eql([serverFailure, cleanupFailure]);
    } finally {
      await fixture.dispose();
    }
  });

  it('rejects unexpected clean keyboard and listener completion', async () => {
    for (const owner of ['keyboard', 'listener'] as const) {
      const fixture = await sourceFixture();
      try {
        const source = await loadGuiDistSource(fixture.dir);
        const serverFinished = Promise.withResolvers<void>();
        const keyboardFinished = Promise.withResolvers<void>();
        const addr: Deno.NetAddr = {
          hostname: '127.0.0.1',
          port: 8080,
          transport: 'tcp',
        };

        const started = await startGuiDistSourceWith(source, {
          serve(options) {
            options.onListen(addr);
            options.signal.addEventListener('abort', () => serverFinished.resolve(), {
              once: true,
            });
            return { addr, finished: serverFinished.promise };
          },
          bindInterrupt() {
            return { dispose() {} };
          },
          bindKeyboard() {
            return {
              dispose() {
                keyboardFinished.resolve();
              },
              finished: keyboardFinished.promise,
            };
          },
          async shutdownKeyboard(handle) {
            handle.dispose();
            await handle.finished;
          },
          print() {},
        });

        owner === 'keyboard' ? keyboardFinished.resolve() : serverFinished.resolve();
        const failure = await rejectionOf(() => started.finished);
        expect(failure.message).to.eql(
          owner === 'keyboard'
            ? 'GUI Dist source keyboard control ended unexpectedly.'
            : 'GUI Dist source listener ended unexpectedly.',
        );
      } finally {
        await fixture.dispose();
      }
    }
  });

  it('awaits startup rollback and preserves presentation plus cleanup failures', async () => {
    for (const cleanupFails of [false, true]) {
      const fixture = await sourceFixture();
      try {
        const source = await loadGuiDistSource(fixture.dir);
        const serverFinished = Promise.withResolvers<void>();
        const keyboardFinished = Promise.withResolvers<void>();
        const presentationFailure = new Error('source presentation failed');
        const cleanupFailure = new Error('source cleanup failed');
        const addr: Deno.NetAddr = {
          hostname: '127.0.0.1',
          port: 8080,
          transport: 'tcp',
        };
        let interruptDisposals = 0;
        let keyboardDisposals = 0;

        const failure = await rejectionOf(() =>
          startGuiDistSourceWith(source, {
            serve(options) {
              options.onListen(addr);
              options.signal.addEventListener('abort', () => serverFinished.resolve(), {
                once: true,
              });
              return { addr, finished: serverFinished.promise };
            },
            bindInterrupt() {
              return {
                dispose() {
                  interruptDisposals += 1;
                },
              };
            },
            bindKeyboard() {
              return {
                dispose() {
                  keyboardDisposals += 1;
                  keyboardFinished.resolve();
                },
                finished: keyboardFinished.promise,
              };
            },
            async shutdownKeyboard(handle) {
              handle.dispose();
              await handle.finished;
              if (cleanupFails) throw cleanupFailure;
            },
            print() {
              throw presentationFailure;
            },
          })
        );

        if (cleanupFails) {
          expect(failure).to.be.instanceOf(AggregateError);
          expect((failure as AggregateError).errors).to.eql([
            presentationFailure,
            cleanupFailure,
          ]);
        } else {
          expect(failure).to.equal(presentationFailure);
        }
        expect(interruptDisposals).to.eql(1);
        expect(keyboardDisposals).to.eql(1);
      } finally {
        await fixture.dispose();
      }
    }
  });
});

type SourceFixture = Readonly<{
  root: t.StringAbsoluteDir;
  dir: t.StringAbsoluteDir;
  manifest: Uint8Array;
  parts: ReadonlyMap<string, Uint8Array>;
  dispose(): Promise<void>;
}>;

async function sourceFixture(): Promise<SourceFixture> {
  const temporary = (await Fs.makeTempDir({ prefix: 'driver-pi.start-gui.source.' })).absolute;
  const root: t.StringAbsoluteDir = await Fs.realPath(temporary);
  const dir: t.StringAbsoluteDir = Fs.join(root, 'dist');
  try {
    await Fs.ensureDir(Fs.join(dir, 'pkg'));
    await Fs.write(Fs.join(dir, 'index.html'), INDEX);
    await Fs.write(Fs.join(dir, 'pkg/entry.js'), SCRIPT);
    await Fs.write(Fs.join(dir, 'space name.js'), SPACE);
    await Fs.write(Fs.join(dir, '東京.js'), UNICODE);
    await Fs.write(Fs.join(dir, 'literal%2Fname.js'), PERCENT);
    const computed = await FsDist.compute({ dir, pkg, builder: pkg, save: true });
    if (computed.error) throw computed.error;

    return Object.freeze({
      root,
      dir,
      manifest: await requireBytes(Fs.join(dir, 'dist.json')),
      parts: new Map([
        ['/index.html', new TextEncoder().encode(INDEX)],
        ['/pkg/entry.js', new TextEncoder().encode(SCRIPT)],
        ['/space%20name.js', new TextEncoder().encode(SPACE)],
        ['/%E6%9D%B1%E4%BA%AC.js', new TextEncoder().encode(UNICODE)],
        ['/literal%252Fname.js', new TextEncoder().encode(PERCENT)],
      ]),
      dispose: async () => {
        await Fs.remove(root);
      },
    });
  } catch (cause) {
    await Fs.remove(root);
    throw cause;
  }
}

async function replaceManifestParts(
  fixture: SourceFixture,
  paths: readonly string[],
): Promise<void> {
  const manifest = Json.parse(new TextDecoder().decode(fixture.manifest)) as t.DistPkg;
  const authority = manifest.hash.parts['index.html'];
  if (!authority) throw new Error('Expected fixture part authority.');

  const parts: Record<string, string> = {};
  for (const path of paths) parts[path] = authority;
  await Fs.write(
    Fs.join(fixture.dir, 'dist.json'),
    Json.stringify({ ...manifest, hash: { ...manifest.hash, parts } }),
  );
}

async function requireBytes(path: t.StringPath): Promise<Uint8Array> {
  const result = await Fs.read(path);
  if (!(result.ok && result.data)) throw result.error;
  return result.data;
}

async function rejectionOf(fn: () => Promise<unknown>): Promise<Error> {
  try {
    await fn();
  } catch (cause) {
    return cause as Error;
  }
  throw new Error('Expected rejection.');
}

function request(path: string, method = 'GET'): Request {
  return new Request(`${ORIGIN}${path}`, { method });
}
