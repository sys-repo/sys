import { Fs } from '@sys/std-s';
import { describe, expect, it } from '../../-test.ts';
import { ViteCmd } from './mod.ts';

describe('ViteCmd', () => {
  it('ViteCmd.outDir', () => {
    const outDir = ViteCmd.outDir;
    expect(outDir.default).to.include('./dist');

    const path1 = outDir.test.random();
    const path2 = outDir.test.random();

    expect(path1).to.include(outDir.test.base);
    expect(path2).to.include(outDir.test.base);
    expect(path1).to.not.eql(path2);
  });

  it('ViteCmd.build', async () => {
    const outDir = ViteCmd.outDir.test.random();
    const res = await ViteCmd.build({ outDir });

    expect(res.paths.outDir).to.eql(outDir);
    expect(res.cmd).to.include('deno run');
    expect(res.cmd).to.include('--node-modules-dir npm:vite');

    const exists = await Fs.exists(res.paths.outDir);
    expect(exists).to.eql(true);
  });
});
