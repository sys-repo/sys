import { describe, expect, it } from '../-test.ts';
import { ViteConfig } from './mod.ts';

describe('ViteConfig', () => {
  it('Config.outDir', () => {
    const outDir = ViteConfig.outDir;
    expect(outDir.default).to.include('./dist');

    const path1 = outDir.test.random();
    const path2 = outDir.test.random();
    const path3 = outDir.test.random('foo');

    expect(path1).to.include(outDir.test.base);
    expect(path2).to.include(outDir.test.base);
    expect(path3.endsWith('-foo')).to.be.true;
    expect(path1).to.not.eql(path2);
  });
});
