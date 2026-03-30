import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { HttpProxy } from '../mod.ts';

describe('HttpProxy', () => {
  it('API', () => {
    expect(HttpProxy).to.be.ok;
    expectTypeOf(HttpProxy).toMatchTypeOf<t.HttpProxy.Lib>();
  });
});
