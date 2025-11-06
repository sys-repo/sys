import { describe, expect, it, pkg } from './-test.ts';
import { Str } from './mod.ts';

describe(`module: ${pkg.name}`, () => {
  it('API', async () => {
    const m = await import('@sys/text');
    expect(m.Str).to.equal(Str);
  });
});
