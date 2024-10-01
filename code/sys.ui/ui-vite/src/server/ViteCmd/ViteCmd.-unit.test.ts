import { Fs, Testing, describe, expect, it } from '../../-test.ts';
import { ViteCmd } from './mod.ts';

describe('ViteCmd', () => {
  const INPUT = {
    sample1: './src/-test/vite.sample-1/index.html',
    sample2: './src/-test/vite.sample-2/index.html',
  } as const;

  it('ViteCmd.outDir', () => {
    const outDir = ViteCmd.Config.outDir;
    expect(outDir.default).to.include('./dist');

    const path1 = outDir.test.random();
    const path2 = outDir.test.random();
    const path3 = outDir.test.random('foo');

    expect(path1).to.include(outDir.test.base);
    expect(path2).to.include(outDir.test.base);
    expect(path3.endsWith('-foo')).to.be.true;
    expect(path1).to.not.eql(path2);
  });

  describe('ViteCmd.build', () => {
    it('sample-1', async () => {
      const outDir = ViteCmd.Config.outDir.test.random();
      const input = INPUT.sample1;
      const res = await ViteCmd.build({ input, outDir });

      expect(res.ok).to.eql(true);
      expect(res.cmd).to.include('deno run');
      expect(res.cmd).to.include('--node-modules-dir npm:vite');

      const html = await Deno.readTextFile(Fs.join(res.paths.outDir, 'index.html'));
      expect(html).to.include('<title>Sample-1</title>');
    });

    });
  });

  describe('ViteCmd.start.dev', () => {
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
     */
    it('start → fetch(200) → dispose', async () => {
      const input = INPUT.sample1;
      const port = Testing.randomPort();
      const svc = ViteCmd.dev({ port, input, silent: false });

      await svc.whenReady();
      await Testing.wait(1000); // NB: wait another moment for the vite server to complete it's startup.

      const res = await fetch(svc.url);
      const html = await res.text();
      expect(res.status).to.eql(200);
      expect(html).to.include(`<script type="module" src="./main.ts">`); // NB: ".ts" because in dev mode.

      console.info(); // NB: pad the output in the test-runner terminal. The "classic" Vite startup output.
      await svc.dispose();
    });
  });
});
