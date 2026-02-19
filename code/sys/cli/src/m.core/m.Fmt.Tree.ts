import { type t } from './common.ts';

export const Tree: t.CliFormatLib['Tree'] = {
  vert: '│',
  mid: '├',
  last: '└',
  bar: '─',
  branch(last, extend = 1) {
    const isLast = Array.isArray(last) ? last[0] === last[1].length - 1 : last;
    const head = isLast ? Tree.last : Tree.mid;
    const bar = '─'.repeat(extend);
    return head + bar;
  },
};
