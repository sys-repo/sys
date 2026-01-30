import { type t, SlugClient as Client, TreeData } from './common.ts';

export const Data: t.TreeHostDataLib = {
  ...TreeData,
  Client,
};
