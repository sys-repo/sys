import { type t, SlugClient as Client } from './common.ts';
import { findNode } from './u.data.findNode.ts';
import { fromSlugTree } from './u.data.fromSlugTree.ts';

export const Data: t.TreeHostDataLib = {
  Client,
  findNode,
  fromSlugTree,
};
