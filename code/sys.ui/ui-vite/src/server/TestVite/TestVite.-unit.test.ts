import { Fs } from '@sys/std-s';
import { TestVite } from './mod.ts';
import { describe, expect, it } from '../../-test.ts';

describe('TestVite', () => {
  it('TestVite.outDir', () => {
    const def = TestVite.outDir.default;
    expect(def).to.include('./.tmp/test/dist');

    const path1 = TestVite.outDir.random();
    const path2 = TestVite.outDir.random();

    expect(path1).to.include(def);
    expect(path2).to.include(def);
    expect(path1).to.not.eql(path2);
  });

  it('TestVite.run', async () => {
    const outDir = TestVite.outDir.random();
    const res = await TestVite.run({ outDir });

    expect(res.paths.outDir).to.eql(outDir);
    expect(res.cmd).to.include('deno task test:vite build --config');

    const exists = await Fs.exists(res.paths.outDir);
    expect(exists).to.eql(true);
  });
});
