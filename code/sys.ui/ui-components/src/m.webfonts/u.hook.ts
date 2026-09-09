import { type t, useWebFont as useBaseHook } from './common.ts';

/** Inject a bundled font family through the React web-font hook. */
export const useFontBundle: t.Fonts.Hook = (bundle) => {
  return useBaseHook(bundle.dir, bundle.config);
};
