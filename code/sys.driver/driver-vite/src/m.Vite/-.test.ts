import { Fs, Testing, Time, describe, expect, it, pkg, type t } from '../-test.ts';
import { ViteConfig } from '../mod.ts';
import { Vite } from './mod.ts';

describe('Vite', () => {
  const INPUT = {
    sample1: './src/-test/vite.sample-1/index.html',
    sample2: './src/-test/vite.sample-2/index.html',
  } as const;

  it('Vite.Config', () => {
    expect(Vite.Config).to.equal(ViteConfig);
  });

  describe('Vite.build', () => {
    const testBuild = async (input: t.StringPath) => {
      const outDir = Vite.Config.outDir.test.random();
      const res = await Vite.build({ pkg, input, outDir });
      const { paths } = res;

      expect(res.ok).to.eql(true);
      expect(res.cmd).to.include('deno run');
      expect(res.cmd).to.include('--node-modules-dir npm:vite');

      const html = await Deno.readTextFile(Fs.join(outDir, 'index.html'));
      const distJson = (await Fs.readJson<t.DistPkg>(Fs.join(outDir, 'dist.json'))).json;
      return {
        res,
        files: { html, distJson },
        paths,
      } as const;
    };

    it.only('sample-1: simple', async () => {
      const { res, files } = await testBuild(INPUT.sample1);
      expect(files.html).to.include(`<title>Sample-1</title>`);
      expect(res.dist).to.eql(files.distJson);
      expect(res.dist.pkg).to.eql(pkg);
      console.info('🌳 dist.json:', res.dist);
    });

    it('sample-2: monorepo imports | Module-B  ←  Module-A', async () => {
      const { files } = await testBuild(INPUT.sample2);
      expect(files.html).to.include(`<title>Sample-2</title>`);
    });
  });

  describe('Vite.start.dev', () => {
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
      const promise = Vite.dev({ input, port, silent: false });
      const svc = await promise;

      svc.proc.onStdErr(async (e) => {
        console.error(`Failed running Vite server within child process`, e.toString());
        await svc.dispose();
      });

      await Testing.wait(1000); // NB: wait another moment for the vite-server to complete it's startup.
      console.info(); // NB: pad the output in the test-runner terminal. The "classic" Vite startup output.

      const controller = new AbortController();
      const { signal } = controller;
      const timeout = Time.delay(5000, () => {
        controller.abort();
        svc?.dispose();
      });

      const res = await fetch(svc.url, { signal });
      const html = await res.text();
      expect(res.status).to.eql(200);
      expect(html).to.include(`<script type="module" src="./main.tsx">`); // NB: ".ts" because in dev mode.

      await svc.dispose();
      timeout.cancel();
    });
  });
});
