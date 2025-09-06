import type { t } from './common.ts';
import { makeFetch as make } from './m.Fetch.make.ts';
import { byteSize } from './u.byteSize.ts';

export const Fetch: t.HttpFetchLib = {
  make,
  byteSize,
};
