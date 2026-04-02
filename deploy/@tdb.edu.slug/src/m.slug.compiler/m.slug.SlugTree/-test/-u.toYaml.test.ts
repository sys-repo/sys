import { type t, describe, expect, it } from '../../-test.ts';
import { toYaml } from '../u.toYaml.ts';
import { Fs, SlugTreeFs, Yaml } from '../common.ts';

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

  it('serializes a slug-tree built from a directory', async () => {
    const dir = await Fs.makeTempDir();
    try {
      const root = Fs.join(dir.absolute, 'root');
      await Fs.ensureDir(root);
      await Fs.write(Fs.join(root, 'alpha.md'), '# Alpha\n');

      const createCrdt = async () => 'crdt:alpha-1' as t.StringRef;
      const doc = await SlugTreeFs.fromDir({ root, createCrdt });
      const yaml = toYaml(doc);
      const parsed = Yaml.parse<t.SlugTreeDoc>(yaml).data;

      expect(parsed).to.eql(doc);
    } finally {
      await Fs.remove(dir.absolute);
    }
  });
});
