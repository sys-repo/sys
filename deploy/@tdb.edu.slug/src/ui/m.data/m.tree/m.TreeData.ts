import { type t } from '../common.ts';
import { findNode } from './u.findNode.ts';
import { findPathByRef } from './u.findPathByRef.ts';
import { findViewNode } from './u.findViewNode.ts';
import { fromSlugTree } from './u.fromSlugTree.ts';

export const TreeData: t.TreeDataLib = {
  findNode,
  findPathByRef,
  findViewNode,
  fromSlugTree,
};
