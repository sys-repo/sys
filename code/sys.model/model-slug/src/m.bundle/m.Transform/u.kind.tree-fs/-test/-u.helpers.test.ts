import { describe, expect, it } from '../../../../-test.ts';
import { SlugBundleTransformTreeFs } from '../mod.ts';

describe('u.kind.tree-fs/u.helpers', () => {
  it('normalizes manifest targets', () => {
    expect(SlugBundleTransformTreeFs.normalizeManifestTargets(undefined)).to.eql([]);
    expect(SlugBundleTransformTreeFs.normalizeManifestTargets(' out/slug-tree.kb.json ')).to.eql([
      'out/slug-tree.kb.json',
    ]);
    expect(
      SlugBundleTransformTreeFs.normalizeManifestTargets([
        ' out/slug-tree.kb.json ',
        '',
        'out/slug-tree.kb.yaml',
      ]),
    ).to.eql(['out/slug-tree.kb.json', 'out/slug-tree.kb.yaml']);
  });

  it('resolves docid from explicit value or manifest filename', () => {
    expect(
      SlugBundleTransformTreeFs.resolveDocid('explicit-kb', 'out/slug-tree.kb.json'),
    ).to.eql('explicit-kb');
    expect(SlugBundleTransformTreeFs.resolveDocid(undefined, 'out/slug-tree.kb.json')).to.eql('kb');
    expect(SlugBundleTransformTreeFs.resolveDocid(undefined, 'out/not-slug-tree.json')).to.eql(
      undefined,
    );
  });

  it('derives assets path only for json slug-tree targets', () => {
    expect(SlugBundleTransformTreeFs.deriveAssetsPath('out/slug-tree.kb.json')).to.eql(
      'out/slug-tree.kb.assets.json',
    );
    expect(SlugBundleTransformTreeFs.deriveAssetsPath('out/slug-tree.kb.yaml')).to.eql(undefined);
  });
});
