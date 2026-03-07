import { type t, D, Url } from './common.ts';
import { rewriteShardHost } from './u.shard.ts';

export const Composition: t.SlugUrlCompositionLib = {
  rewriteShardHost,

  manifestsLocation(baseUrl, options) {
    return {
      baseUrl: options?.urls?.manifestBase ?? baseUrl,
      manifestsDir: options?.layout?.manifestsDir ?? D.manifestsDir,
    };
  },

  contentLocation(baseUrl, options) {
    return {
      baseUrl: options?.urls?.contentBase ?? baseUrl,
      contentDir: options?.layout?.contentDir ?? D.contentLocation,
    };
  },

  manifests(args) {
    return Url.parse(args.baseUrl).join(args.manifestsDir, args.filename);
  },

  content(args) {
    return Url.parse(args.baseUrl).join(args.contentDir, args.filename);
  },

  descriptor(args) {
    return Url.parse(args.origin).join(args.manifests, args.filename);
  },
};
