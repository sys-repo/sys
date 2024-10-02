import { Fs, Testing, describe, expect, it } from '../-test.ts';
import { ViteConfig } from '../mod.ts';
import { ViteProcess } from './mod.ts';

describe('ViteProcess', () => {
  const INPUT = {
    sample1: './src/-test/vite.sample-1/index.html',
    sample2: './src/-test/vite.sample-2/index.html',
  } as const;

  it('ViteProcess.Config', () => {
    expect(ViteProcess.Config).to.equal(ViteConfig);
  });

  describe('ViteProcess.build', () => {
    /**
     *  local monorepo import: Module-A  ←  Module-B
     *  (see sample source)
     */
    it('sample: monorepo imports ← Vite {resolve/alias}', async () => {
      const outDir = ViteProcess.Config.outDir.test.random();
      const input = INPUT.sample1;
      const res = await ViteProcess.build({ input, outDir });

      expect(res.ok).to.eql(true);
      expect(res.cmd).to.include('deno run');
      expect(res.cmd).to.include('--node-modules-dir npm:vite');

      const html = await Deno.readTextFile(Fs.join(res.paths.outDir, 'index.html'));
      expect(html).to.include('<title>Sample-1</title>');
    });
  });

  describe('ViteProcess.start.dev', () => {
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
    it('start → fetch(200) → dispose', async () => {
      const input = INPUT.sample1;
      const port = Testing.randomPort();
      const svc = await ViteProcess.dev({ port, input, silent: false });

      await Testing.wait(1000); // NB: wait another moment for the vite-server to complete it's startup.

      const res = await fetch(svc.url);
      const html = await res.text();
      expect(res.status).to.eql(200);
      expect(html).to.include(`<script type="module" src="./main.tsx">`); // NB: ".ts" because in dev mode.

      console.info(); // NB: pad the output in the test-runner terminal. The "classic" Vite startup output.
      await svc.dispose();
    });
  });
});
