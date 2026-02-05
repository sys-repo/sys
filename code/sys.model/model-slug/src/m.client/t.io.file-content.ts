import type { t } from './common.ts';

/** Loader options for slug file-content endpoints. */
export type SlugFileContentLoadOptions = t.SlugLoadOptions;

/** File-content endpoint loaders. */
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

/** File-content loaders scoped to a descriptor client. */
export type SlugClientFileContentFromDescriptorLib = {
  readonly index: (
    options?: t.SlugFileContentLoadOptions,
  ) => Promise<t.SlugClientResult<t.SlugFileContentIndex>>;
  readonly get: (
    hash: string,
    options?: t.SlugFileContentLoadOptions,
  ) => Promise<t.SlugClientResult<t.SlugFileContentDoc>>;
};
