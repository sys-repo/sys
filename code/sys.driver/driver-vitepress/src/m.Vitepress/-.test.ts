import { describe, expect, it, Testing, Time } from '../-test.ts';
import { SAMPLE } from './-u.ts';
import { VitePress } from './mod.ts';

describe('Vitepress', () => {
  describe('VitePress.dev', () => {
    it('process: start → fetch(200) → dispose', async () => {
      const sample = await SAMPLE.setup();
      const { port, path } = sample;
      const svc = await VitePress.dev({ port, path });
      expect(svc.port).to.eql(port);
      expect(svc.path).to.eql(path);

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
      expect(html).to.include(`<script type="module"`);
      expect(html).to.include(`node_modules/.deno/vitepress@`);

      await svc.dispose();
      timeout.cancel();
    });
  });
});
