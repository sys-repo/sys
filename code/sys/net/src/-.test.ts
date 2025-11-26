import { type t, describe, it, expect, Pkg, pkg } from './-test.ts';
import { Net } from './m.Net/mod.ts';

describe(`module: ${Pkg.toString(pkg)}`, () => {
  it('API', async () => {
    const m = await import('@sys/net');
    expect(m.Net).to.equal(Net);
  });
});
