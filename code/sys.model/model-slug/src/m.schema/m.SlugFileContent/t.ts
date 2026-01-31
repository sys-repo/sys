import type { t } from './common.ts';

/** Type re-export */
export type * from './t.lib.ts';

export type SlugFileContentFrontmatter = {
  readonly ref: t.StringRef;
  readonly title?: string;
  readonly [key: string]: unknown;
};

export type SlugFileContentEntry = {
  readonly hash: string;
  readonly contentType: string;
  readonly frontmatter: SlugFileContentFrontmatter;
  readonly path?: t.StringPath;
};

export type SlugFileContentDoc = SlugFileContentEntry & {
  readonly source: string;
};

export type SlugFileContentIndex = {
  readonly entries: readonly SlugFileContentEntry[];
};

export type SlugFileContentSchemaIsLib = {
  readonly doc: (value: unknown) => value is t.SlugFileContentDoc;
  readonly entry: (value: unknown) => value is t.SlugFileContentEntry;
  readonly index: (value: unknown) => value is t.SlugFileContentIndex;
};
