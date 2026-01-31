import type { t } from './common.ts';

/** Type re-export */
export type * from './t.lib.ts';

export type SlugFileContentDoc = {
  readonly source: string;
  readonly hash: string;
  readonly contentType: string;
  readonly path?: t.StringPath;
};

export type SlugFileContentSchemaIsLib = {
  readonly doc: (value: unknown) => value is t.SlugFileContentDoc;
};
