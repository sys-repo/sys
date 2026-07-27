import { Is, type t } from '../common.ts';

export const Tree: t.CliFormat.Tree.Lib = {
  vert: '│',
  mid: '├',
  last: '└',
  bar: '─',
  branch(last, extend = 1) {
    const isLast = Is.array(last) ? last[0] === last[1].length - 1 : last;
    const head = isLast ? Tree.last : Tree.mid;
    const bar = Tree.bar.repeat(extend);
    return head + bar;
  },
};
