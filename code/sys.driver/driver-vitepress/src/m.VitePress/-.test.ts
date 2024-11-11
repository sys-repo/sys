import { describe, expect, it, Testing, Time } from '../-test.ts';
import { SAMPLE } from './-u.ts';
import { VitePress } from './mod.ts';

describe('Vitepress', () => {
  describe('VitePress.dev', () => {
    it('process: start → fetch(200) → dispose', async () => {
      const sample = await SAMPLE.setup();
      const { port, path } = sample;
      const server = await VitePress.dev({ port, path });
      expect(server.port).to.eql(port);
      expect(server.path).to.eql(path);

      await Testing.wait(1000); // NB: wait another moment for the vite-server to complete it's startup.
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
      expect(html).to.include(`<script type="module"`);
      expect(html).to.include(`node_modules/.deno/vitepress@`);

      await server.dispose();
      timeout.cancel();
    });
  });

  describe('VitePress.build', () => {
    it.skip('sample-1', async () => {
      /**
       * TODO 🐷
       */
    });
  });
});
