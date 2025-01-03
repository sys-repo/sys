import { describe, expect, it } from '../-test.ts';
import { assertEnvExists, SAMPLE } from './-u.ts';
import { VitePress } from './mod.ts';

describe('VitePress.dev', () => {
  const open = false;

  it('process: start → fetch(200) → dispose', async () => {
    const sample = SAMPLE.init();
    const { port, inDir } = sample;
    await VitePress.Env.update({ inDir });

    const server = await VitePress.dev({ port, inDir, open }); // NB: await returns after Vitepress as completed it's startup.
    expect(server.port).to.eql(port);
    expect(server.dirs.in).to.eql(inDir);

    console.info(); //            NB: pad the output in the test-runner terminal. The "classic" Vite startup output.

    const res = await fetch(server.url);
    const html = await res.text();

    expect(res.status).to.eql(200);
    expect(html).to.include(`<script type="module"`);
    expect(html).to.include(`node_modules/.deno/vitepress@`);

    await server.dispose();
  });

  it('process: ensures baseline files ← Env.init()', async () => {
    const sample = SAMPLE.init();
    const { port, inDir } = sample;
    await VitePress.Env.update({ inDir });

    const server = await VitePress.dev({ port, inDir, open });
    await server.dispose();
    await assertEnvExists(inDir);
  });
});
