import { type t, describe, expect, it } from '../../../../-test.ts';
import { TreeData } from '../mod.ts';
import { findNode } from '../u.findNode.ts';

describe('Data.findNode', () => {
  const TREE: t.SlugTreeItems = [
    {
      slug: 'a',
      slugs: [{ slug: 'b', slugs: [{ slug: 'c' }] }, { slug: 'x' }],
    },
    { slug: 'd' },
  ];
  const DOC: t.SlugTreeDoc = { tree: TREE };

  it('API', () => {
    expect(TreeData.findNode).to.equal(findNode);
  });

  it('resolves root items by slug path', () => {
    const result = findNode(DOC, ['a']);
    expect(result).to.eql(TREE[0]);
  });

  it('resolves deeply nested children', () => {
    const result = findNode(DOC, ['a', 'b', 'c']);
    expect(result?.slug).to.eql('c');
  });

  it('returns undefined for an empty path', () => {
    const result = findNode(DOC, [] as t.ObjectPath);
    expect(result).to.be.undefined;
  });

  it('returns undefined when segments are not strings', () => {
    expect(findNode(DOC, [0] as t.ObjectPath)).to.be.undefined;
    expect(findNode(DOC, ['a', 1] as t.ObjectPath)).to.be.undefined;
  });

  it('returns undefined when a slug segment cannot be found', () => {
    expect(findNode(DOC, ['missing'])).to.be.undefined;
  });

  it('returns undefined when path continues past a leaf without children', () => {
    expect(findNode(DOC, ['d', 'child'])).to.be.undefined;
  });
});
