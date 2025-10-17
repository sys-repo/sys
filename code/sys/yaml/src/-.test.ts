import { describe, expect, it, Pkg, pkg } from './-test.ts';
import { Yaml } from './mod.ts';

describe(`module: ${Pkg.toString(pkg)}`, () => {
  it('API', async () => {
    const a = await import('@sys/yaml');
    const b = await import('@sys/yaml/core');

    expect(a.Yaml).to.equal(Yaml);
    expect(a.Yaml).to.equal(b.Yaml);
  });
});
