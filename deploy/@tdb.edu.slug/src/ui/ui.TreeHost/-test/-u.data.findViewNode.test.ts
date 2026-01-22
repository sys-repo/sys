import { type t, describe, expect, it } from '../../../-test.ts';
import { TreeHost } from '../mod.ts';
import { findViewNode } from '../u.data.findViewNode.ts';

describe('Data.findViewNode', () => {
  it('API', () => {
    expect(TreeHost.Data.findViewNode).to.equal(findViewNode);
  });

  it('returns undefined for empty tree', () => {
    const tree: t.TreeHostViewNodeList = [];
    const res = findViewNode(tree, ['a']);
    expect(res).to.eql(undefined);
  });

  it('returns undefined for empty path', () => {
    const tree: t.TreeHostViewNodeList = [{ path: ['a'], key: 'a', label: 'a' }];
    const res = findViewNode(tree, []);
    expect(res).to.eql(undefined);
  });

  it('finds root node', () => {
    const a: t.TreeHostViewNode = {
      path: ['a'],
      key: 'a',
      label: 'a',
      value: { slug: 'a', ref: 'docA' },
    };
    const tree: t.TreeHostViewNodeList = [a];

    const res = findViewNode(tree, ['a']);
    expect(res).to.equal(a);
    expect(res?.value).to.eql({ slug: 'a', ref: 'docA' });
  });

  it('finds deep node', () => {
    const c: t.TreeHostViewNode = { path: ['a', 'b', 'c'], key: 'a/b/c', label: 'c' };
    const b: t.TreeHostViewNode = { path: ['a', 'b'], key: 'a/b', label: 'b', children: [c] };
    const a: t.TreeHostViewNode = { path: ['a'], key: 'a', label: 'a', children: [b] };
    const tree: t.TreeHostViewNodeList = [a];

    const res = findViewNode(tree, ['a', 'b', 'c']);
    expect(res).to.equal(c);
  });

  it('returns undefined when not found', () => {
    const c: t.TreeHostViewNode = { path: ['a', 'b', 'c'], key: 'a/b/c', label: 'c' };
    const b: t.TreeHostViewNode = { path: ['a', 'b'], key: 'a/b', label: 'b', children: [c] };
    const a: t.TreeHostViewNode = { path: ['a'], key: 'a', label: 'a', children: [b] };
    const tree: t.TreeHostViewNodeList = [a];

    const res = findViewNode(tree, ['a', 'x']);
    expect(res).to.eql(undefined);
  });

  it('handles invalid path segments', () => {
    const a: t.TreeHostViewNode = { path: ['a'], key: 'a', label: 'a' };
    const tree: t.TreeHostViewNodeList = [a];

    const res1 = findViewNode(tree, ['']);
    expect(res1).to.eql(undefined);

    const res2 = findViewNode(tree, [0 as unknown as string]);
    expect(res2).to.eql(undefined);
  });
});
