import { Fs } from '@sys/std-s';
import { describe, expect, it } from '../../-test.ts';
import { ViteCmd } from './mod.ts';

describe('ViteCmd', () => {
  it('ViteCmd.outDir', () => {
    const def = ViteCmd.outDir.default;
    expect(def).to.include('./.tmp/test/dist');

    const path1 = ViteCmd.outDir.random();
    const path2 = ViteCmd.outDir.random();

    expect(path1).to.include(def);
    expect(path2).to.include(def);
    expect(path1).to.not.eql(path2);
  });

  it('ViteCmd.run', async () => {
    const outDir = ViteCmd.outDir.random();
    const res = await ViteCmd.run({ outDir });

    expect(res.paths.outDir).to.eql(outDir);
    expect(res.cmd).to.include('deno run');
    expect(res.cmd).to.include('--node-modules-dir npm:vite');

    const exists = await Fs.exists(res.paths.outDir);
    expect(exists).to.eql(true);
  });
});
