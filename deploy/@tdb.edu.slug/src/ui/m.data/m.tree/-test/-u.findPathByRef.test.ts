import { type t, describe, expect, it } from '../../../../-test.ts';
import { TreeData } from '../mod.ts';
import { findPathByRef } from '../u.findPathByRef.ts';

describe('Data.findPathByRef', () => {
  it('API', () => {
    expect(TreeData.findPathByRef).to.equal(findPathByRef);
  });

  it('returns undefined for empty tree', () => {
    const tree: t.TreeHostViewNodeList = [];
    expect(findPathByRef(tree, 'doc-a')).to.eql(undefined);
  });

  it('returns undefined for empty ref', () => {
    const tree: t.TreeHostViewNodeList = [{ path: ['a'], key: 'a', label: 'a' }];
    expect(findPathByRef(tree, '')).to.eql(undefined);
  });

  it('resolves root node path by ref', () => {
    const tree: t.TreeHostViewNodeList = [
      { path: ['a'], key: 'a', label: 'a', value: { slug: 'a', ref: 'doc-a' } },
    ];
    expect(findPathByRef(tree, 'doc-a')).to.eql(['a']);
  });

  it('resolves deep node path by ref', () => {
    const c: t.TreeHostViewNode = {
      path: ['a', 'b', 'c'],
      key: 'a/b/c',
      label: 'c',
      value: { slug: 'c', ref: 'doc-c' },
    };
    const b: t.TreeHostViewNode = { path: ['a', 'b'], key: 'a/b', label: 'b', children: [c] };
    const a: t.TreeHostViewNode = { path: ['a'], key: 'a', label: 'a', children: [b] };
    const tree: t.TreeHostViewNodeList = [a];
    expect(findPathByRef(tree, 'doc-c')).to.eql(['a', 'b', 'c']);
  });

  it('returns undefined when ref not found', () => {
    const tree: t.TreeHostViewNodeList = [
      { path: ['a'], key: 'a', label: 'a', value: { slug: 'a', ref: 'doc-a' } },
    ];
    expect(findPathByRef(tree, 'missing')).to.eql(undefined);
  });
});
