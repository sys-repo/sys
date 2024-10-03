import { describe, expect, it, ROOT } from '../-test.ts';
import { ViteConfig } from './mod.ts';

describe('ViteConfig.workspace', () => {
  it('loads (via path)', async () => {
    const a = await ViteConfig.workspace(); // NB: finds root workspace
    const b = await ViteConfig.workspace(ROOT.denofile.path);
    const c = await ViteConfig.workspace(undefined, { walkup: false });

    expect(a.exists).to.eql(true);
    expect(b.exists).to.eql(true);
    expect(a.paths.includes('./code/sys/std')).to.eql(true);
    expect(a.paths).to.eql(b.paths);
    expect(c.exists).to.eql(false); // NB: did not walk up to the root workspace `deno.json`
  });

  it('builds {alias} list', async () => {
    const ws = await ViteConfig.workspace();
    const alias = ws.resolution.alias;

    const a = alias['@sys/tmp/ui'];
    const b = ROOT.resolve('./code/sys.tmp/src/ui/mod.ts');
    expect(a).to.eql(b);
  });
});
