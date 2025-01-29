import { describe, expect, it } from '../-test.ts';
import { ViteConfig } from './mod.ts';

describe('ViteConfig', () => {
  it('Config.outDir', () => {
    const outDir = ViteConfig.outDir;
    expect(outDir.default).to.include('./dist');
  });
});
