import { describe, expect, it } from '../../../-test.ts';
import { Data } from '../m.Data.ts';
import { HttpOrigin } from '../mod.ts';

describe('HttpOrigin.Data', () => {
  it('API', () => {
    expect(HttpOrigin.Data).to.equal(Data);
  });
});
