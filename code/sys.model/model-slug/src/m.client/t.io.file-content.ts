import type { t } from './common.ts';

export type SlugFileContentLoadOptions = t.SlugLoadOptions & {
  manifestsBaseUrl?: t.StringUrl;
  contentBaseUrl?: t.StringUrl;
};

export type SlugClientFileContentLib = {
  readonly index: (
    baseUrl: t.StringUrl,
    docid: t.StringId,
    options?: t.SlugFileContentLoadOptions,
  ) => Promise<t.SlugClientResult<t.SlugFileContentIndex>>;
  readonly get: (
    baseUrl: t.StringUrl,
    hash: string,
    options?: t.SlugFileContentLoadOptions,
  ) => Promise<t.SlugClientResult<t.SlugFileContentDoc>>;
};

export type SlugClientFileContentFromDescriptorLib = {
  readonly index: (
    options?: t.SlugLoadOptions,
  ) => Promise<t.SlugClientResult<t.SlugFileContentIndex>>;
  readonly get: (
    hash: string,
    options?: t.SlugFileContentLoadOptions,
  ) => Promise<t.SlugClientResult<t.SlugFileContentDoc>>;
};
