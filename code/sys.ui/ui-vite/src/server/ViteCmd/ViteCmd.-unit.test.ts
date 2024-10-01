import { Fs, Testing, describe, expect, it } from '../../-test.ts';
import { ViteCmd } from './mod.ts';

describe('ViteCmd', () => {
  const INPUT = {
    sample1: './src/-test/vite.sample-1/index.html',
  } as const;

  it('ViteCmd.outDir', () => {
    const outDir = ViteCmd.outDir;
    expect(outDir.default).to.include('./dist');

    const path1 = outDir.test.random();
    const path2 = outDir.test.random();
    const path3 = outDir.test.random('foo');

    expect(path1).to.include(outDir.test.base);
    expect(path2).to.include(outDir.test.base);
    expect(path3.endsWith('-foo')).to.be.true;
    expect(path1).to.not.eql(path2);
  });

  it('ViteCmd.build', async () => {
    const outDir = ViteCmd.outDir.test.random();
    const input = INPUT.sample1;

    const res = await ViteCmd.build({ input, outDir });
    expect(res.cmd).to.include('deno run');
    expect(res.cmd).to.include('--node-modules-dir npm:vite');

    const exists = await Fs.exists(res.paths.outDir);
    expect(exists).to.eql(true);
  });

  it('ViteCmd.start.dev', async () => {
    const input = INPUT.sample1;
    const port = Testing.randomPort();
    const svc = ViteCmd.start.dev({ port, input });
    await svc.whenReady();

    /**
     * Fetch
     */
    await Testing.wait(1500);
    const res = await fetch(svc.url);
    const html = await res.text();
    expect(res.status).to.eql(200);
    expect(html).to.include(`<script type="module" src="./main.ts">`); // NB: .ts because in dev mode.

    await svc.dispose();
  });
});
