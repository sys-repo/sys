import { type t, describe, expect, it } from '../../-test.ts';
import { fromDir } from '../u.fromDir.ts';
import { toYaml } from '../u.toYaml.ts';
import { Fs, Yaml } from '../common.ts';

describe('SlugTree.toYaml', () => {
  it('serializes a slug-tree that round-trips through YAML', () => {
    const tree: t.SlugTreeItems = [
      { slug: 'alpha', ref: 'crdt:alpha' },
      { slug: 'beta', slugs: [{ slug: 'child', ref: 'crdt:child' }] },
    ];

    const yaml = toYaml(tree);
    const parsed = Yaml.parse<t.SlugTreeItems>(yaml).data;

    expect(parsed).to.eql(tree);
  });

  it('serializes a slug-tree built from a directory', async () => {
    const dir = await Fs.makeTempDir();
    try {
      const root = Fs.join(dir.absolute, 'root');
      await Fs.ensureDir(root);
      await Fs.write(Fs.join(root, 'alpha.md'), '# Alpha\n');

      const createCrdt = async () => 'crdt:alpha-1' as t.StringRef;
      const tree = await fromDir({ root, createCrdt });
      const yaml = toYaml(tree);
      const parsed = Yaml.parse<t.SlugTreeItems>(yaml).data;

      expect(parsed).to.eql(tree);
    } finally {
      await Fs.remove(dir.absolute);
    }
  });
});
