import type { t } from './common.ts';

/**
 * Library for copying template files.
 */
export type TmplLib = {
  create(source: t.StringDir, target: t.StringDir, fn?: t.TmplProcessFile): Tmpl;
};

/**
 * Handler that runs for each template file being copied.
 * Use this to:
 *  - filter out files (incl. marking as "user-space" exclusions)
 *  - adjust the text content before writing.
 *  - adjust the target filename.
 */
export type TmplProcessFile = (args: TmplProcessFileArgs) => void;
export type TmplProcessFileArgs = {
  readonly target: {};
  readonly path: t.StringPath;
  exclude(reason: string): void;
  changeText(text: string): void;
  changeFilename(text: string): void;
};

/**
 * A template copier.
 */
export type Tmpl = {
  readonly source: t.TmplDir;
  readonly target: t.TmplDir;
  copy(): Promise<t.TmplCopyResponse>;
};

export type TmplCopyResponse = {
  readonly files: t.TmplFileUpdate[];
};

/**
 * A directory involved in a [Tmpl] configuration.
 */
export type TmplDir = {
  readonly dir: t.StringDir;
  ls(): Promise<t.StringPath[]>;
};

/**
 * Details about a file update.
 */
export type TmplFileUpdate = {
  readonly op: 'Created' | 'Updated' | 'Unchanged';
  readonly path: t.StringPath;
  readonly is: { different: boolean; excluded: boolean; userspace: boolean };
};
