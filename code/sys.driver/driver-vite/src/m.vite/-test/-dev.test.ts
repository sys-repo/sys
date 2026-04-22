import {
  type t,
  c,
  describe,
  expect,
  Fs,
  it,
  pkg,
  SAMPLE,
  Testing,
  Time,
} from '../../-test.ts';
import { writeLocalFixtureImports } from '../../m.vite/-test/u.bridge.fixture.ts';
import { Vite } from '../mod.ts';

const DEV_FETCH_TIMEOUT = 5_000 as t.Msecs;
const DEV_CONNECT_RETRY_TIMEOUT = 2_000 as t.Msecs;
const DEV_CONNECT_RETRY_INTERVAL = 100 as t.Msecs;
const DEV_ENTRY_RETRY_TIMEOUT = 2_000 as t.Msecs;
const DEV_ENTRY_RETRY_INTERVAL = 100 as t.Msecs;

describe('Vite.dev', () => {
  const printHtml = (html: string, title: string, dir: t.StringDir) => {
    console.info();
    console.info(c.brightCyan(`${c.bold(title)}:`));
    console.info(c.gray(Fs.trimCwd(dir)), '\n');
    console.info(c.italic(c.yellow(html)));
    console.info();
  };

  /**
   * Dev Mode: long-running child process runing the Vite server.
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
   *
   */
  it('process: start → fetch(200) → dispose', async () => {
    await Testing.retry(2, async () => {
      const fs = await SAMPLE.fs('Vite.dev');
      const cwd = fs.join('fixture');
      await Fs.copy(SAMPLE.Dirs.sample2, cwd);
      await prepareDevEntryFixture(cwd);
      const restore = await writeLocalFixtureImports(cwd);
      const paths = {
        cwd,
        app: {
          entry: 'index.html',
          outDir: 'dist',
          base: './',
        },
      } as const;
      const port = Testing.randomPort();
      let server: t.ViteProcess | undefined;
      let timeout: t.TimeDelayPromise | undefined;
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
          server?.dispose();
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

  it('falls forward to the next port when requested port is occupied', async () => {
    await Testing.retry(2, async () => {
      const fs = await SAMPLE.fs('Vite.dev-port-fallback');
      const cwd = fs.join('fixture');
      await Fs.copy(SAMPLE.Dirs.sample2, cwd);
      await prepareDevEntryFixture(cwd);
      const restore = await writeLocalFixtureImports(cwd);
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
      let server: t.ViteProcess | undefined;
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

async function prepareDevEntryFixture(cwd: string) {
  const entryDir = Fs.join(cwd, 'src/-entry');
  await Fs.write(
    Fs.join(entryDir, 'index.html'),
    [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '  <head>',
      '    <meta charset="UTF-8" />',
      '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
      '    <title>Sample-2</title>',
      '  </head>',
      '  <body>',
      '    <div id="root"></div>',
      '    <script type="module" src="./main.js"></script>',
      '  </body>',
      '</html>',
      '',
    ].join('\n'),
  );
  await Fs.write(
    Fs.join(entryDir, 'main.js'),
    [
      `import React from 'react';`,
      `import { createRoot } from 'react-dom/client';`,
      `import '@sys/driver-vite/sample-imports';`,
      `const dynamic = import('../m.foo.ts');`,
      `dynamic.then((mod) => console.info('💦 dynmaic import', mod));`,
      `const root = createRoot(document.getElementById('root'));`,
      `root.render(React.createElement('div', { style: { border: 'solid 1px blue' } }, 'dev ok'));`,
      '',
    ].join('\n'),
  );
}

async function fetchWhenReady(
  url: string,
  args: {
    signal: AbortSignal;
    server: t.ViteProcess;
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
    server: t.ViteProcess;
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
