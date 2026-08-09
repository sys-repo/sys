import {
  c,
  describe,
  expect,
  Fs,
  Http,
  it,
  Rx,
  SAMPLE,
  Str,
  type t,
  Testing,
  Time,
  Try,
} from '../../-test.ts';
import { writeLocalFixtureImports } from '../../m.vite/-test/u.bridge.fixture.ts';
import { Vite } from '../mod.ts';

const DEV_FETCH_TIMEOUT = 5_000 as t.Msecs;
const DEV_CONNECT_RETRY_TIMEOUT = 2_000 as t.Msecs;
const DEV_CONNECT_RETRY_INTERVAL = 100 as t.Msecs;
// Vite dev can transiently 404/500 an entry while the server finishes cold-start transforms.
// The dev contract we own here is eventual entry readiness once the server is up.
const DEV_ENTRY_RETRY_TIMEOUT = 5_000 as t.Msecs;
const DEV_ENTRY_RETRY_INTERVAL = 100 as t.Msecs;

describe('Vite.dev', () => {
  /**
   * Dev Mode: long-running child process running the Vite server.
   * Uses Deno's NPM compatibility layer.
   *
   * Command:
   *    $ vite dev --port=<1234>
   *
   * Terminal Output:
   *
   *    VITE v<0.0.0>  ready in 350 ms
   *
   *    ➜  Local:   http://localhost:1234/
   *    ➜  Network: use --host to expose
   */
  it('process: start → fetch(200) → dispose', async () => {
    await Testing.retry(2, async () => {
      const fs = await SAMPLE.fs('Vite.dev');
      const cwd = fs.join('fixture');
      await Fs.copy(SAMPLE.Dirs.sample2, cwd);
      await prepareDevEntryFixture(cwd);
      const restore = await writeLocalFixtureImports(cwd, 'vite.config.ts', { skipTsconfig: true });
      const paths = {
        cwd,
        app: {
          entry: 'index.html',
          outDir: 'dist',
          base: './',
        },
      } as const;
      const port = Testing.randomPort();
      let server: t.Vite.Dev.Process | undefined;
      let timeout: t.Time.Delay.Promise | undefined;
      const controller = new AbortController();
      let stderr = '';

      try {
        const promise = Vite.dev({ cwd, paths, port, silent: false });
        server = await promise; // NB: readySignal looks for Vite startup message in [stdout].

        server.proc.onStdErr((e) => {
          stderr += e.toString();
        });

        console.info(); // NB: pad the output in the test-runner terminal. The "classic" Vite startup output.

        const { signal } = controller;

        // Vite.dev(...) does not return until the child server is reachable.
        timeout = Time.delay(DEV_FETCH_TIMEOUT, () => {
          controller.abort();
          void server?.dispose().catch(() => undefined);
        });
        console.info(c.yellow(`\nInvoking test fetch to: ${c.white(server.url)}`));

        const res = await fetchWhenReady(server.url, {
          signal,
          server,
          stderr: () => stderr,
        });
        const html = await res.text();
        printHtml(html, 'Fetched HTML', cwd);

        const entryUrl = `${server.url}main.js`;
        const { res: entryRes, text: entryText } = await fetchEntryWhenReady(entryUrl, {
          signal,
          server,
          stderr: () => stderr,
        });

        expect(res.status).to.eql(200);
        expect(html).to.include(`<script type="module" src="./main.js">`);
        expect(html).to.include(`@vite/client`);
        if (entryRes.status !== 200) {
          throw new Error(
            `Expected dev entry fetch to return 200, got ${entryRes.status}.\n\n` +
              `url: ${entryUrl}\n\n` +
              `entry body:\n${entryText}\n\n` +
              `stderr:\n${stderr.trim()}`,
          );
        }
        expect(entryText).to.include('sample-imports');
      } finally {
        controller.abort();
        timeout?.cancel();
        await server?.dispose();
        await restore();
      }
    });
  });

  it('native disposal is outer completion truth under await using', async () => {
    const fs = await SAMPLE.fs('Vite.dev-native-disposal');
    const cwd = fs.join('fixture');
    await Fs.copy(SAMPLE.Dirs.sample2, cwd);
    await prepareDevEntryFixture(cwd);
    const restore = await writeLocalFixtureImports(cwd, 'vite.config.ts', { skipTsconfig: true });
    const paths = {
      cwd,
      app: {
        entry: 'index.html',
        outDir: 'dist',
        base: './',
      },
    } as const;
    let server: t.Vite.Dev.Process | undefined;

    try {
      server = await Vite.dev({ paths, port: Testing.randomPort(), silent: true });
      const fired: t.DisposeAsyncEvent[] = [];
      server.dispose$.subscribe((event) => fired.push(event));

      {
        await using resource = server;
        expect(resource.disposed).to.eql(false);
      }

      const completion = server.dispose('direct:later');
      expect(server[Symbol.asyncDispose]()).to.equal(completion);
      await completion;
      expect(server.disposed).to.eql(true);
      expect(server.proc.disposed).to.eql(true);
      expect(fired.map((event) => event.payload.stage)).to.eql(['start', 'complete']);
      expect(fired.map((event) => event.payload.reason)).to.eql([undefined, undefined]);
    } finally {
      await server?.dispose();
      await restore();
    }
  });

  it('preserves a child-first reason at the outer lifecycle boundary', async () => {
    const fs = await SAMPLE.fs('Vite.dev-child-first-reason');
    const cwd = fs.join('fixture');
    await Fs.copy(SAMPLE.Dirs.sample2, cwd);
    await prepareDevEntryFixture(cwd);
    const restore = await writeLocalFixtureImports(cwd, 'vite.config.ts', { skipTsconfig: true });
    const paths = {
      cwd,
      app: {
        entry: 'index.html',
        outDir: 'dist',
        base: './',
      },
    } as const;
    let server: t.Vite.Dev.Process | undefined;

    try {
      server = await Vite.dev({ paths, port: Testing.randomPort(), silent: true });
      const port = server.port;
      const fired: t.DisposeAsyncEvent[] = [];
      server.dispose$.subscribe((event) => fired.push(event));

      const childCompletion = server.proc.dispose('child:first');
      const outerCompletion = server.dispose('outer:later');
      expect(server[Symbol.asyncDispose]()).to.equal(outerCompletion);
      await Promise.all([childCompletion, outerCompletion]);

      expect(fired.map((event) => event.payload.stage)).to.eql(['start', 'complete']);
      expect(fired.map((event) => event.payload.reason)).to.eql([
        'child:first',
        'child:first',
      ]);
      expect((await Testing.connect(port)).refused).to.eql(true);
    } finally {
      await server?.dispose();
      await restore();
    }
  });

  it('pre-aborted and synchronous until inputs cancel startup promptly', async () => {
    const abort = new AbortController();
    abort.abort('pre-aborted');
    const cases: readonly { readonly label: string; readonly until: t.UntilInput }[] = [
      { label: 'pre-aborted', until: abort.signal },
      { label: 'synchronous', until: Rx.of({ reason: 'synchronous:until' }) },
    ];

    for (const test of cases) {
      const fs = await SAMPLE.fs(`Vite.dev-${test.label}-until`);
      const cwd = fs.join('fixture');
      await Fs.copy(SAMPLE.Dirs.sample2, cwd);
      await prepareDevEntryFixture(cwd);
      const restore = await writeLocalFixtureImports(cwd, 'vite.config.ts', {
        skipTsconfig: true,
      });
      const paths = {
        cwd,
        app: {
          entry: 'index.html',
          outDir: 'dist',
          base: './',
        },
      } as const;
      const port = Testing.randomPort();
      const startedAt = Date.now();

      try {
        const error = await catchError(() =>
          Vite.dev({ paths, port, silent: true, until: test.until })
        );

        expect(error?.message).to.contain('Vite.dev: failed to start dev server');
        expect(Date.now() - startedAt).to.be.lessThan(10_000);
        expect((await Testing.connect(port)).refused).to.eql(true);
      } finally {
        await restore();
      }
    }
  });

  it('cancels the HTTP readiness wait through the outer lifecycle', async () => {
    const fs = await SAMPLE.fs('Vite.dev-http-ready-cancel');
    const cwd = fs.join('fixture');
    await Fs.copy(SAMPLE.Dirs.sample2, cwd);
    await prepareDevEntryFixture(cwd);
    const restore = await writeLocalFixtureImports(cwd, 'vite.config.ts', { skipTsconfig: true });
    const paths = {
      cwd,
      app: {
        entry: 'index.html',
        outDir: 'dist',
        base: './',
      },
    } as const;
    const port = Testing.randomPort();
    const until = new AbortController();
    const waiting = Promise.withResolvers<AbortSignal | undefined>();
    const descriptor = Object.getOwnPropertyDescriptor(Http.Client, 'waitFor');
    if (!descriptor) throw new Error('Missing Http.Client.waitFor descriptor');

    Object.defineProperty(Http.Client, 'waitFor', {
      ...descriptor,
      value: (...args: Parameters<typeof Http.Client.waitFor>) => {
        const signal = args[1]?.signal;
        waiting.resolve(signal);
        return new Promise<never>((_resolve, reject) => {
          const fail = () => reject(new Error('Vite.dev:test:http-wait-aborted'));
          if (!signal || signal.aborted) fail();
          else signal.addEventListener('abort', fail, { once: true });
        });
      },
    });

    try {
      const startup = Vite.dev({ paths, port, silent: true, until: until.signal });
      const signal = await waiting.promise;
      const abortedAt = Date.now();
      until.abort('test:http-ready-cancel');
      const error = await catchError(() => startup);

      expect(signal?.aborted).to.eql(true);
      expect(error?.message).to.contain('Vite.dev: failed to start dev server');
      expect(Date.now() - abortedAt).to.be.lessThan(2_000);
      expect((await Testing.connect(port)).refused).to.eql(true);
    } finally {
      Object.defineProperty(Http.Client, 'waitFor', descriptor);
      await restore();
    }
  });

  it('outer disposal preserves raw child cleanup failure truth', async () => {
    const fs = await SAMPLE.fs('Vite.dev-cleanup-failure');
    const cwd = fs.join('fixture');
    await Fs.copy(SAMPLE.Dirs.sample2, cwd);
    await prepareDevEntryFixture(cwd);
    const restore = await writeLocalFixtureImports(cwd, 'vite.config.ts', { skipTsconfig: true });
    const paths = {
      cwd,
      app: {
        entry: 'index.html',
        outDir: 'dist',
        base: './',
      },
    } as const;
    let server: t.Vite.Dev.Process | undefined;
    let disposeProcess: t.Process.Handle['dispose'] | undefined;

    try {
      server = await Vite.dev({ paths, port: Testing.randomPort(), silent: true });
      disposeProcess = server.proc.dispose;
      const failure = new Error('Vite.dev:test:cleanup-failure');
      const fired: t.DisposeAsyncEvent[] = [];
      let childReason: unknown;
      server.dispose$.subscribe((event) => fired.push(event));
      Object.defineProperty(server.proc, 'dispose', {
        configurable: true,
        value: (reason?: unknown) => {
          childReason = reason;
          return Promise.reject(failure);
        },
      });

      const completion = server.dispose('direct:first');
      expect(server[Symbol.asyncDispose]()).to.equal(completion);

      let caught: unknown;
      try {
        await completion;
      } catch (error) {
        caught = error;
      }

      expect(caught).to.equal(failure);
      expect(childReason).to.eql('direct:first');
      expect(server.disposed).to.eql(true);
      expect(fired.map((event) => event.payload.stage)).to.eql(['start', 'error']);
      expect(fired.map((event) => event.payload.reason)).to.eql([
        'direct:first',
        'direct:first',
      ]);
    } finally {
      if (server && disposeProcess) {
        Object.defineProperty(server.proc, 'dispose', {
          configurable: true,
          value: disposeProcess,
        });
        await disposeProcess();
      }
      await restore();
    }
  });

  it('rejects strict startup when requested port is occupied', async () => {
    await Testing.retry(2, async () => {
      const fs = await SAMPLE.fs('Vite.dev-strict-port-occupied');
      const cwd = fs.join('fixture');
      await Fs.copy(SAMPLE.Dirs.sample2, cwd);
      await prepareDevEntryFixture(cwd);
      const restore = await writeLocalFixtureImports(cwd, 'vite.config.ts', { skipTsconfig: true });
      const paths = {
        cwd,
        app: {
          entry: 'index.html',
          outDir: 'dist',
          base: './',
        },
      } as const;
      const requestedPort = Testing.randomPort();
      const blocker = Deno.listen({ hostname: '0.0.0.0', port: requestedPort });

      try {
        const error = await catchError(() =>
          Vite.dev({ cwd, paths, port: requestedPort, strictPort: true, silent: true })
        );

        expect(error?.message).to.contain('Vite.dev: failed to start strict dev server');
        expect(error?.message).to.contain(`port ${requestedPort}`);
        expect((error?.cause as Error | undefined)?.message).to.contain(
          `Port already in use: ${requestedPort}`,
        );
      } finally {
        blocker.close();
        await restore();
      }
    });
  });

  it('falls forward to the next port when requested port is occupied', async () => {
    await Testing.retry(2, async () => {
      const fs = await SAMPLE.fs('Vite.dev-port-fallback');
      const cwd = fs.join('fixture');
      await Fs.copy(SAMPLE.Dirs.sample2, cwd);
      await prepareDevEntryFixture(cwd);
      const restore = await writeLocalFixtureImports(cwd, 'vite.config.ts', { skipTsconfig: true });
      const paths = {
        cwd,
        app: {
          entry: 'index.html',
          outDir: 'dist',
          base: './',
        },
      } as const;
      const requestedPort = Testing.randomPort();
      const blocker = Deno.listen({ hostname: '0.0.0.0', port: requestedPort });
      let server: t.Vite.Dev.Process | undefined;
      let stderr = '';

      try {
        server = await Vite.dev({ cwd, paths, port: requestedPort, silent: true });
        server.proc.onStdErr((e) => {
          stderr += e.toString();
        });

        const actualPort = Number(new URL(server.url).port);
        expect(actualPort).to.not.eql(requestedPort);
        expect(server.port).to.eql(actualPort);

        const res = await fetchWhenReady(server.url, {
          signal: AbortSignal.timeout(DEV_FETCH_TIMEOUT),
          server,
          stderr: () => stderr,
        });
        const html = await res.text();

        expect(res.status).to.eql(200);
        expect(html).to.include(`@vite/client`);
      } finally {
        await server?.dispose();
        blocker.close();
        await restore();
      }
    });
  });
});

/**
 * Helpers:
 */
function printHtml(html: string, title: string, dir: t.StringDir) {
  console.info();
  console.info(c.brightCyan(`${c.bold(title)}:`));
  console.info(c.gray(Fs.trimCwd(dir)), '\n');
  console.info(c.italic(c.yellow(html)));
  console.info();
}

async function prepareDevEntryFixture(cwd: string) {
  const entryDir = Fs.join(cwd, 'src/-entry');
  await Fs.write(
    Fs.join(entryDir, 'index.html'),
    Str.dedent(`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Sample-2</title>
      </head>
      <body>
        <div id="root"></div>
        <script type="module" src="./main.js"></script>
      </body>
    </html>
    `),
  );
  await Fs.write(
    Fs.join(entryDir, 'main.js'),
    Str.dedent(`
      import React from 'react';
      import { createRoot } from 'react-dom/client';
      import '@sys/driver-vite/sample-imports';
      const dynamic = import('../m.foo.ts');
      dynamic.then((mod) => console.info('💦 dynamic import', mod));
      const root = createRoot(document.getElementById('root'));
      root.render(React.createElement('div', { style: { border: 'solid 1px blue' } }, 'dev ok'));
    `),
  );
}

async function catchError(fn: () => Promise<unknown>): Promise<Error | undefined> {
  const { result } = await Try.run(fn);
  return result.ok ? undefined : result.error;
}

async function fetchWhenReady(
  url: string,
  args: {
    signal: AbortSignal;
    server: t.Vite.Dev.Process;
    stderr: () => string;
  },
) {
  const started = Date.now();
  let lastError: unknown;

  while (Date.now() - started < DEV_CONNECT_RETRY_TIMEOUT) {
    try {
      return await fetch(url, { signal: args.signal });
    } catch (error) {
      lastError = error;
      if (args.signal.aborted) throw error;

      const text = String(error);
      const isRefused = text.includes('Connection refused') || text.includes('tcp connect error');
      if (!isRefused) throw error;

      if (args.server.proc.disposed) {
        const stderr = args.stderr().trim();
        throw new Error(
          stderr
            ? `Vite dev server exited before first fetch.\n\nstderr:\n${stderr}`
            : 'Vite dev server exited before first fetch.',
        );
      }

      await Time.wait(DEV_CONNECT_RETRY_INTERVAL);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function fetchEntryWhenReady(
  url: string,
  args: {
    signal: AbortSignal;
    server: t.Vite.Dev.Process;
    stderr: () => string;
  },
) {
  const started = Date.now();
  let last = {
    res: new Response('', { status: 500 }),
    text: '',
  };

  while (Date.now() - started < DEV_ENTRY_RETRY_TIMEOUT) {
    const res = await fetch(url, { signal: args.signal });
    const text = await res.text();
    last = { res, text };

    if (res.status === 200) return last;
    if (args.signal.aborted) return last;
    if (res.status < 500) return last;

    if (args.server.proc.disposed) {
      const stderr = args.stderr().trim();
      throw new Error(
        stderr
          ? `Vite dev server exited before serving the entry module.\n\nstderr:\n${stderr}`
          : 'Vite dev server exited before serving the entry module.',
      );
    }

    await Time.wait(DEV_ENTRY_RETRY_INTERVAL);
  }

  return last;
}
