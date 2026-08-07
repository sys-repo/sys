import { Fs, type t } from '../common.ts';
import { Pkg as FsPkg } from '@sys/fs/pkg';
import { START_GUI_SOURCE } from '../u.start/u.gui.ts';

export type Started = t.HttpServer.Started;
export type Keyboard = t.Cli.Keyboard.Bind.Handle;

export function asProfileRoot(root: t.StringDir): t.PiCli.Cwd {
  return {
    root,
    git: root,
    invoked: root,
  };
}

export function fakeGeneration(): t.Dist.Existing {
  return {
    kind: 'existing',
    dir: '/tmp/driver-pi-gui-generation' as t.StringAbsoluteDir,
    integrity: START_GUI_SOURCE.integrity,
    verification: {
      integrity: START_GUI_SOURCE.integrity,
      dist: {
        type: 'https://jsr.io/@sample/driver-pi-gui',
        pkg: { name: '@sample/driver-pi-gui', version: '1.0.0' },
        build: {
          time: 0,
          size: { total: 0, pkg: 0 },
          builder: '@sample/builder@1.0.0',
          runtime: '<runtime-uri>',
          hash: { policy: 'https://jsr.io/@sample/hash/0.0.1/src/hash.ts' },
        },
        hash: { digest: START_GUI_SOURCE.integrity, parts: {} },
      },
      manifestBytes: 0,
      assets: { files: 0, totalBytes: 0, packageBytes: 0 },
    },
    source: { configuredUrl: START_GUI_SOURCE.manifestUrl },
    cleanup: 'not-needed',
  };
}

export function deferred(): { readonly promise: Promise<void>; readonly resolve: () => void } {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

export function startedFixture(input: {
  close?: (reason: unknown) => Promise<void>;
  finished?: Promise<void>;
} = {}): Started {
  return {
    origin: 'http://127.0.0.1:1234' as t.StringUrl,
    close: input.close ?? (() => Promise.resolve()),
    finished: input.finished ?? Promise.resolve(),
  } as Started;
}

export async function rejectionOf(action: () => Promise<unknown>): Promise<Error> {
  try {
    await action();
  } catch (cause) {
    return cause instanceof Error ? cause : new Error(String(cause));
  }
  throw new Error('Expected rejection.');
}

export async function loopbackDistFixture() {
  const source = (await Fs.makeTempDir({ prefix: 'driver-pi.start-gui.source.' }))
    .absolute as t.StringDir;
  await Fs.write(Fs.join(source, 'index.html'), '<h1>verified driver-pi fixture</h1>');
  await Fs.write(Fs.join(source, 'assets/app.js'), 'console.info("verified");');
  const computed = await FsPkg.Dist.compute({
    dir: source,
    pkg: { name: '@sample/driver-pi-gui', version: '1.0.0' },
    builder: { name: '@sample/builder', version: '1.0.0' },
    save: true,
  });
  const assets = new Map<string, Uint8Array>();
  for (const path of Object.keys(computed.dist.hash.parts)) {
    assets.set(`/${path}`, await Deno.readFile(Fs.join(source, path)));
  }
  const manifest = await Deno.readFile(Fs.join(source, 'dist.json'));
  const server = Deno.serve({ hostname: '127.0.0.1', port: 0, onListen() {} }, (request) => {
    const path = new URL(request.url).pathname;
    if (path === '/dist.json') return new Response(manifest);
    const asset = assets.get(path);
    return asset ? new Response(asset.buffer as ArrayBuffer) : new Response(null, { status: 404 });
  });
  const address = server.addr as Deno.NetAddr;
  const origin = `http://127.0.0.1:${address.port}` as t.StringUrl;

  return {
    integrity: computed.manifest.integrity,
    manifestUrl: `${origin}/dist.json` as t.StringUrl,
    origin,
    async dispose() {
      await server.shutdown();
      await Fs.remove(source);
    },
  };
}
