import { describe, expect, it } from '../../-test.ts';
import { Modules } from '../m.Modules.ts';
import { Esm } from '../mod.ts';

describe('Jsr.Esm', () => {
  it('API', () => {
    expect(Esm.Modules).to.equal(Modules);
    expect(Esm.modules).to.equal(Modules.create);
  });
});
