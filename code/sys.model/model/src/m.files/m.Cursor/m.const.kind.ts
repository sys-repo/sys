import { type t } from './common.ts';

export const prefix: t.Files.Cursor.Prefix = 'files:cursor';
export const version: t.Files.Cursor.Version = 'v1';

export const Kind: t.Files.Cursor.KindMap = {
  list: 'list',
  watch: 'watch',
  manifest: 'manifest',
};
