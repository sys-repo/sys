import { type t } from '../common.ts';

export function sampleTree(): t.TreeHostViewNodeList {
  const b: t.TreeHostViewNode = {
    path: ['a', 'b'],
    key: 'a/b',
    label: 'b',
    value: { slug: 'b', ref: 'ref-b' },
  };
  const a: t.TreeHostViewNode = {
    path: ['a'],
    key: 'a',
    label: 'a',
    value: { slug: 'a', ref: 'ref-a' },
    children: [b],
  };
  return [a];
}
