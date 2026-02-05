import { type t, Url } from './common.ts';

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

export const ClientUrl = {
  manifests(args: ManifestsArgs): string {
    return Url.parse(args.baseUrl).join(args.manifestsDir, args.filename);
  },

  content(args: ContentArgs): string {
    return Url.parse(args.baseUrl).join(args.contentDir, args.filename);
  },

  descriptor(args: DescriptorArgs): string {
    return Url.parse(args.origin).join(args.manifests, args.filename);
  },
};
