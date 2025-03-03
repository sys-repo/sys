import { describe, expect, it, Testing } from '../-test.ts';
import { assertEnvExists, Sample } from './-u.ts';
import { Vitepress } from './mod.ts';

describe('VitePress.dev', () => {
  it(
    'process: start → fetch(200) → dispose',
    { sanitizeResources: false, sanitizeOps: false },
    async () => {
      await Testing.retry(3, async () => {
        const open = false;
        const sample = Sample.init();
        const { port, inDir } = sample;
        await Vitepress.Tmpl.write({ inDir });
        const server = await Vitepress.dev({ port, inDir, open }); // NB: await returns after Vitepress as completed it's startup.

        try {
          expect(server.port).to.eql(port);
          expect(server.dirs.in).to.eql(inDir);

          console.info(); // NB: pad the output in the test-runner terminal. The "classic" Vite startup output.

          const res = await fetch(server.url);
          const html = await res.text();

          expect(res.status).to.eql(200);
          expect(html).to.include(`<script type="module"`);
          expect(html).to.include(`node_modules/.deno/vitepress@`);
        } catch (error) {
          throw error;
        } finally {
          await server.dispose();
        }
      });
    },
  );

  it(
    'process: ensures baseline files ← Env.init()',
    { sanitizeResources: false, sanitizeOps: false },
    async () => {
      await Testing.retry(3, async () => {
        const open = false;
        const sample = Sample.init();
        const { port, inDir } = sample;
        await Vitepress.Tmpl.write({ inDir });

        const server = await Vitepress.dev({ port, inDir, open });
        await server.dispose();
        await assertEnvExists(inDir);
      });
    },
  );
});
