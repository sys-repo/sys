import { type t, D, Url } from './common.ts';
import { rewriteShardHost } from './u.rewriteShardHost.ts';

type ManifestsLocation = {
  readonly baseUrl: t.StringUrl;
  readonly manifestsDir: t.StringDir;
};

type ContentLocation = {
  readonly baseUrl: t.StringUrl;
  readonly contentDir: t.StringDir;
};

type ManifestsArgs = {
  baseUrl: t.StringUrl;
  manifestsDir: t.StringDir;
  filename: string;
};

type ContentArgs = {
  baseUrl: t.StringUrl;
  contentDir: t.StringDir;
  filename: string;
};

type DescriptorArgs = {
  origin: t.StringUrl;
  manifests: t.StringPath;
  filename: string;
};

type RewriteShardHostArgs = {
  href: string;
  asset: t.SpecTimelineAsset;
  layout?: t.SlugClientLayout;
};

type ClientUrlLib = {
  readonly manifestsLocation: (
    baseUrl: t.StringUrl,
    options?: t.SlugLoadOptions,
  ) => ManifestsLocation;
  readonly contentLocation: (baseUrl: t.StringUrl, options?: t.SlugLoadOptions) => ContentLocation;
  readonly manifests: (args: ManifestsArgs) => string;
  readonly content: (args: ContentArgs) => string;
  readonly descriptor: (args: DescriptorArgs) => string;
  readonly rewriteShardHost: (args: RewriteShardHostArgs) => string;
};

export const ClientUrl: ClientUrlLib = {
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
