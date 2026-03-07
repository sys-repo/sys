import { type t, useWebFont as useBaseHook } from './common.ts';

export const useFontBundle: t.Fonts.Hook = (bundle) => {
  return useBaseHook(bundle.dir, bundle.config);
};
