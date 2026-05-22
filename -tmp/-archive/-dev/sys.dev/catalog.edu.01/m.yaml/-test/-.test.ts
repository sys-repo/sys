import { describe, expect, it } from '../../-test.ts';
import { Slug } from '../m.Slug.ts';
import { YamlPipeline } from '../mod.ts';

describe(`YamlPipeline`, () => {
  it('API', async () => {
    expect(YamlPipeline.Slug).to.equal(Slug);
  });
});
