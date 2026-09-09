import { type t } from '../common.ts';
import { Is } from './m.Is.ts';
import { fromNode } from './u.fromNode.ts';
import { walk } from './u.walk.ts';

export const Tree: t.SlugTreeLib = {
  Is,
  fromNode,
  walk,
};
