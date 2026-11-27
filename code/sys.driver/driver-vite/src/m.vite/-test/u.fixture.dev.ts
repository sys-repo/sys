import { Fs, Rx, type t } from '../common.ts';
import type { ViteDevDeps } from '../t.internal.ts';

export function processEvent(source: t.Process.StdStream, text: string): t.Process.Event {
  return {
    source,
    data: new TextEncoder().encode(text),
    toString: () => text,
  };
}

export function paths(): t.ViteConfig.Paths {
  return {
    cwd: '/tmp/pkg',
    app: {
      entry: 'src/index.html',
      outDir: 'dist',
      base: './',
    },
  };
}

export function pkg(): t.Pkg {
  return {
    name: '@sys/example',
    version: '0.0.0',
  };
}

/** A ready dev process without a child, filesystem manifest, or HTTP request. */
export function createDevStartupFixtures(disposeBootstrap = () => Promise.resolve()) {
  const life = Rx.lifecycleAsync();
  const handle: t.Process.Handle = {
    pid: 1,
    $: Rx.subject<t.Process.Event>().asObservable(),
    is: { ready: true },
    whenReady: () => Promise.resolve(handle),
    onStdOut: () => handle,
    onStdErr: () => handle,
    dispose: life.dispose,
    [Symbol.asyncDispose]: life[Symbol.asyncDispose],
    dispose$: life.dispose$,
    get disposed() {
      return life.disposed;
    },
  };
  return {
    spawn: () => handle,
    loadDist: (path) => Promise.resolve({ exists: false, kind: 'missing', path: Fs.resolve(path) }),
    command: () => Promise.resolve({ cmd: 'vite', args: [], env: {}, dispose: disposeBootstrap }),
    waitForHttp: (url) => Promise.resolve({ url, attempts: 1, elapsed: 0 as t.Msecs }),
  } satisfies ViteDevDeps;
}
