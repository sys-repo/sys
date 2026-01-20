import { type t, describe, expect, it } from '../../../-test.ts';
import { TreeHost } from '../mod.ts';
import { findNode } from '../u.data.findNode.ts';

const TREE: t.SlugTreeItems = [
  {
    slug: 'a',
    slugs: [{ slug: 'b', slugs: [{ slug: 'c' }] }, { slug: 'x' }],
  },
  { slug: 'd' },
];

describe('findNode', () => {
  it('API', () => {
    expect(TreeHost.Data.findNode).to.equal(findNode);
  });

  it('resolves root items by slug path', () => {
    const result = findNode(TREE, ['a']);
    expect(result).to.eql(TREE[0]);
  });

  it('resolves deeply nested children', () => {
    const result = findNode(TREE, ['a', 'b', 'c']);
    expect(result?.slug).to.eql('c');
  });

  it('returns undefined for an empty path', () => {
    const result = findNode(TREE, [] as t.ObjectPath);
    expect(result).to.be.undefined;
  });

  it('returns undefined when segments are not strings', () => {
    expect(findNode(TREE, [0] as t.ObjectPath)).to.be.undefined;
    expect(findNode(TREE, ['a', 1] as t.ObjectPath)).to.be.undefined;
  });

  it('returns undefined when a slug segment cannot be found', () => {
    expect(findNode(TREE, ['missing'])).to.be.undefined;
  });

  it('returns undefined when path continues past a leaf without children', () => {
    expect(findNode(TREE, ['d', 'child'])).to.be.undefined;
  });
});
