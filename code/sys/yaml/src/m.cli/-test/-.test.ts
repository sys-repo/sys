import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { YamlConfig } from '../mod.ts';

describe(`yaml: cli tools`, () => {
  it('API', async () => {
    const m = await import('@sys/yaml/cli');
    expect(m.YamlConfig).to.equal(YamlConfig);
  });
});
