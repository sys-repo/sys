import type { t } from './common.ts';

/** Type re-export */
export type * from './t.lib.ts';

export type SlugFileContentDoc = {
  readonly source: string;
  readonly hash: string;
  readonly contentType: string;
  readonly frontmatter: SlugFileContentFrontmatter;
  readonly path?: t.StringPath;
};

export type SlugFileContentFrontmatter = {
  readonly ref: t.StringRef;
  readonly title?: string;
  readonly [key: string]: unknown;
};

export type SlugFileContentSchemaIsLib = {
  readonly doc: (value: unknown) => value is t.SlugFileContentDoc;
};
