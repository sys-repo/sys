import { type t } from '../common.ts';

export function manifestMeta(args: {
  readonly capabilities: t.Files.Capabilities;
  readonly page?: t.Files.ManifestPageMeta;
  readonly dist?: t.Files.ManifestDistMeta;
}): t.Files.ManifestMeta {
  return {
    version: 'sys.files.manifest:v1',
    capabilities: args.capabilities,
    ...(args.dist === undefined ? {} : { dist: args.dist }),
    ...(args.page === undefined ? {} : { page: args.page }),
  };
}

export function pageMeta(args: {
  readonly cursor?: t.Files.Cursor.Manifest;
  readonly truncated?: boolean;
}): t.Files.ManifestPageMeta | undefined {
  if (args.cursor === undefined && args.truncated === undefined) return undefined;
  return {
    ...(args.cursor === undefined ? {} : { cursor: args.cursor }),
    ...(args.truncated === undefined ? {} : { truncated: args.truncated }),
  };
}
