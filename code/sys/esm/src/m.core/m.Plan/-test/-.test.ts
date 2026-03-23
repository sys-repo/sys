import { describe, expect, it } from '../../../-test.ts';
import { Plan } from '../mod.ts';
import { Esm } from '../../mod.ts';

describe('Esm.Plan', () => {
  it('API', () => {
    expect(Esm.Plan).to.equal(Plan);
  });
});
