import { describe, expect, it } from '../../-test.ts';
import { fromYaml } from '../m.Slug.fromYaml.ts';
import { Slug } from '../m.Slug.ts';
import { YamlPipeline } from '../mod.ts';

describe(`YamlPipeline`, () => {
  it('API', () => {
    expect(YamlPipeline.Slug).to.equal(Slug);
    expect(Slug.fromYaml).to.equal(fromYaml);
  });
});
