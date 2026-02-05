import type { t } from './common.ts';

/** Type re-export */
export type * from './t.lib.ts';

/** Frontmatter metadata for a slug content entry. */
export type SlugFileContentFrontmatter = {
  readonly ref: t.StringRef;
  readonly title?: string;
  readonly [key: string]: unknown;
};

/** Entry metadata for a single content file. */
export type SlugFileContentEntry = {
  readonly hash: string;
  readonly contentType: string;
  readonly frontmatter: SlugFileContentFrontmatter;
  readonly path?: t.StringPath;
};

/** Full content document with source payload. */
export type SlugFileContentDoc = SlugFileContentEntry & {
  readonly source: string;
};

/** Index document listing content entries. */
export type SlugFileContentIndex = {
  readonly docid: t.StringId;
  readonly entries: readonly SlugFileContentEntry[];
};

/** Type guards for file-content documents. */
export type SlugFileContentSchemaIsLib = {
  readonly doc: (value: unknown) => value is t.SlugFileContentDoc;
  readonly entry: (value: unknown) => value is t.SlugFileContentEntry;
  readonly index: (value: unknown) => value is t.SlugFileContentIndex;
};
