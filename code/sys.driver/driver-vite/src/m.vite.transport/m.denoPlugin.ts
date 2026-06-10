import { type t } from './common.ts';
import prefixPlugin from './u/u.prefix.ts';
import { createResolvePlugin } from './u.resolve/u.resolve.ts';

export const denoPlugin: t.ViteTransport.Lib['denoPlugin'] = (options = {}) => {
  const cache = new Map<string, t.DenoResolved>() satisfies t.DenoCache;
  return [prefixPlugin(cache), createResolvePlugin(cache, undefined, options)] as t.VitePlugin[];
};
