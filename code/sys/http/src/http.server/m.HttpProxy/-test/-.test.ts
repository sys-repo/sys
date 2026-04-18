import { type t, describe, expect, expectTypeOf, it } from '../../../-test.ts';
import { HttpProxy } from '../mod.ts';

describe('HttpProxy', () => {
  it('API', async () => {
    const m = await import('@sys/http/server');
    expect(m.HttpProxy).to.equal(HttpProxy);
    expect(HttpProxy).to.be.ok;
    expectTypeOf(HttpProxy).toMatchTypeOf<t.HttpProxy.Lib>();
  });
});
