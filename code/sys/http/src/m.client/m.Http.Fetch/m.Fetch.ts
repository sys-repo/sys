import type { t } from './common.ts';
import { create } from './m.Fetch.create.ts';
import { byteSize } from './u.byteSize.ts';

export const Fetch: t.HttpFetchLib = {
  create,
  byteSize,
};
