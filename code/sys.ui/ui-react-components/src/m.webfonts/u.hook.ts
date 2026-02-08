import { type t, useWebFont as useBaseHook } from './common.ts';

export const useFont: t.WebFonts.Hook = (bundle) => {
  return useBaseHook(bundle.dir, bundle.config);
};
