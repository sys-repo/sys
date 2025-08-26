import { type t, describe, it, expect, Testing, pkg } from '../../-test.ts';
import { Tmpl } from '../mod.ts';

describe(`${pkg.name}: file-system tools`, () => {
  it('API', async () => {
    const m = await import('@sys/ui-factory/fs');
    expect(m.Tmpl).to.equal(Tmpl);
  });
});
