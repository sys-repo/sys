import { type t, c, describe, expect, Fs, it, SAMPLE, Testing, Time } from '../-test.ts';
import { Vite } from './mod.ts';

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
    await Testing.retry(3, async () => {
      const fs = SAMPLE.fs('Vite.dev');
      await Fs.copy(SAMPLE.Dirs.sample2, fs.dir);

      const cwd = fs.dir;
      const port = Testing.randomPort();
      const promise = Vite.dev({ cwd, port, silent: false });
      const server = await promise; // NB: readySignal looks for Vite startup message in [stdout].

      server.proc.onStdErr(async (e) => {
        console.error(`Failed running Vite server within child process`, e.toString());
        await server.dispose();
      });

      console.info(); // NB: pad the output in the test-runner terminal. The "classic" Vite startup output.

      const controller = new AbortController();
      const { signal } = controller;
      const timeout = Time.delay(5000, () => {
        controller.abort();
        server?.dispose();
      });

      await Time.wait(1000);
      console.info(c.yellow(`\nInvoking test fetch to: ${c.white(server.url)}`));

      const res = await fetch(server.url, { signal });
      const html = await res.text();
      printHtml(html, 'Fetched HTML', cwd);

      expect(res.status).to.eql(200);
      expect(html).to.include(`<script type="module" src="./main.tsx">`); // NB: ".tsx" because in dev mode.
      expect(html).to.include(`<script type="module" src="/@vite/client">`);
      expect(html).to.include(`injectIntoGlobalHook(window);`);

      await server.dispose();
      timeout.cancel();
    });
  });
});
