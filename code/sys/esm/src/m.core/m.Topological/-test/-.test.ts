import { describe, expect, it } from '../../../-test.ts';
import { Topological } from '../mod.ts';
import { Esm } from '../../mod.ts';

describe('Esm.Topological', () => {
  it('API', () => {
    expect(Esm.Topological).to.equal(Topological);
  });
});
