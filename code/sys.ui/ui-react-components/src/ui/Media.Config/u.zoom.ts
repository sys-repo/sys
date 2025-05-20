import { type t, D } from './common.ts';

export const values: t.MediaZoomLib['values'] = (keys) => {
  const res: Partial<t.MediaZoomValues> = {};
  keys.forEach((k) => (res[k] = D.zoom[k].initial));
  return res;
};
