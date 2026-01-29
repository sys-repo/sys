import { type t, SlugClient as Client } from '../common.ts';
import { findNode } from './u.findNode.ts';
import { findViewNode } from './u.findViewNode.ts';
import { fromSlugTree } from './u.fromSlugTree.ts';

export const TreeData: t.TreeHostDataLib = {
  Client,
  findNode,
  findViewNode,
  fromSlugTree,
};
