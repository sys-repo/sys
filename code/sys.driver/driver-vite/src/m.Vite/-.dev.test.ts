import { describe, expect, it, Testing, Time } from '../-test.ts';
import { INPUT } from './-u.ts';
import { Vite } from './mod.ts';

describe('Vite.dev', () => {
  /**
   * Dev Mode: long-running child process runing the Vite server.
   * Uses Deno's NPM compatibility layer.
   *
   * Command:
   *    $ vite dev --port=<1234>
   *
   * Terminal Output:
   *
   *    VITE v5.4.7  ready in 350 ms
   *
   *    ➜  Local:   http://localhost:1234/
   *    ➜  Network: use --host to expose
   *
   */
  it('process: start → fetch(200) → dispose', async () => {
    await Testing.retry(3, async () => {
      const input = INPUT.sample1;
      const port = Testing.randomPort();
      const promise = Vite.dev({ input, port, silent: false });
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

      const res = await fetch(server.url, { signal });
      const html = await res.text();
      expect(res.status).to.eql(200);
      expect(html).to.include(`<script type="module" src="./main.tsx">`); // NB: ".ts" because in dev mode.

      await server.dispose();
      timeout.cancel();
    });
  });
});
