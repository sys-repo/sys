import { type t } from './common.ts';
import prefixPlugin from './u.prefix.ts';
import { createResolvePlugin } from './u.resolve.ts';

export const denoPlugin: t.ViteTransport.Lib['denoPlugin'] = () => {
  const cache = new Map<string, t.DenoResolved>() satisfies t.DenoCache;
  return [prefixPlugin(cache), createResolvePlugin(cache)] as t.VitePlugin[];
};
