import { describe, expect, it } from '../-test.ts';
import { Dom } from '../m.Dom/mod.ts';
import { UserHas } from './mod.ts';

describe('Dom.Events:', () => {
  it('API', () => {
    expect(Dom.UserHas).to.equal(UserHas);
  });
});
