import { describe, expect, it, pkg } from '../-test.ts';
import { cli } from './mod.ts';

describe(`${pkg.name}/tmpl: Template Generation`, () => {
  it('API', async () => {
    const m = await import('@sys/ui-factory/tmpl');
    expect(m.cli).to.equal(cli);
  });
});
