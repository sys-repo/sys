import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { ReverseProxy } from '../mod.ts';

describe('ReverseProxy', () => {
  it('API', () => {
    expect(ReverseProxy).to.be.ok;
    expectTypeOf(ReverseProxy).toMatchTypeOf<t.ReverseProxy.Lib>();
  });
});
