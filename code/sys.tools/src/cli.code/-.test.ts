import { describe, expect, it } from '../-test.ts';
import { D } from './common.ts';
import * as CodeTools from './mod.ts';

describe(D.tool.name, () => {
  it('API', async () => {
    const m = await import('@sys/tools/code');
    expect(m.cli).to.equal(CodeTools.cli);
  });
});
