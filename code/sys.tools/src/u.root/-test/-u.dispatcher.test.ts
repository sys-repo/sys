import { describe, it, expect } from '../../-test.ts';
import { Imports } from '../u.imports.ts';
import { D } from '../common.ts';

describe('Root Dispatcher', () => {
  it('each tool import exports cli(cwd, argv)', async () => {
    for (const cmd of D.TOOLS) {
      const mod = await Imports[cmd]();

      const hasCli = typeof (mod as { readonly cli?: unknown }).cli === 'function';
      expect(hasCli, `tool "${cmd}" must export cli(cwd, argv) from its mod.ts`).eql(true);
    }
  });
});
