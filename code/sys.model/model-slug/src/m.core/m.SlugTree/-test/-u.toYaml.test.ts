import { type t, describe, expect, it, Yaml } from '../../../-test.ts';
import { toYaml } from '../u.toYaml.ts';

describe('SlugTree.toYaml', () => {
  it('serializes a slug-tree that round-trips through YAML', () => {
    const doc: t.SlugTreeDoc = {
      tree: [
        { slug: 'alpha', ref: 'crdt:alpha' },
        { slug: 'beta', slugs: [{ slug: 'child', ref: 'crdt:child' }] },
      ],
    };

    const yaml = toYaml(doc);
    const parsed = Yaml.parse<t.SlugTreeDoc>(yaml).data;

    expect(parsed).to.eql(doc);
  });
});
