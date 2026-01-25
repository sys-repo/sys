import type { t } from './common.ts';
import { create as crdt } from './m.Storage.crdt.ts';

export const Storage: t.MastraStorageLib = {
  crdt,
};
