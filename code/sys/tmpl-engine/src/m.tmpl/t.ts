import type { t } from './common.ts';

type O = Record<string, unknown>;

/**
 * Library for copying template files.
 */
export type TmplLib = {
  /** Tools for converting a Tmpl to console/log output. */
  readonly Log: t.TmplLogLib;

  /** Tools for modifying template files once written to the file-system. */
  readonly File: t.TmplFileLib;

  /** FileMap toolkit (bundling, validation, materialize). */
  readonly FileMap: t.FileMapLib;

  /** Create a new directory template. */
  from: t.TmplFactory;
};

/**
 * Generator function for a directory Template.
 */
export type TmplFactory = (
  source: t.StringDir | t.FileMap,
  options?: t.TmplFactoryOptions | t.TmplProcessFile,
) => t.Tmpl;

/** Options passed to the template engine factory. */
export type TmplFactoryOptions = {
  /** Context data passed to the process handler. */
  ctx?: O;
  /** Handler to process each file in the template. */
  processFile?: t.TmplProcessFile;
};

/**
 * A template engine.
 */
export type Tmpl = {
  /** Retrieve the file-map that makes up the template */
  source(): Promise<t.TmplContent>;

  /** Perform a copy of the templates to a target directory. */
  write(target: t.StringDir, options?: t.TmplWriteOptions): Promise<t.TmplWriteResult>;

  /** Clones the template filtering down to a subset of source files. */
  filter(fn: t.TmplFilter): t.Tmpl;
};

/** The content of a template */
export type TmplContent = {
  readonly dir: t.StringAbsoluteDir;
  readonly fileMap: t.FileMap;
};

/**
 * A filter on template source files.
 * NB: this differs from "exclude" whereby it filters out any knowledge of the
 *     file's existence in the source directory, however exclude acknowledges the
 *     existence of the file but excludes it from the set of templates that
 *     are copied to the target.
 */
export type TmplFilter = t.FileMapFilter;

/**
 * Handler that runs for each template file being copied.
 * Use this to:
 *  - filter out files (incl. marking as "user-space" exclusions)
 *  - adjust the content before writing.
 *  - adjust the target filename.
 */
export type TmplProcessFile = t.FileMapProcessor;

/** Options passed to the `tmpl.copy` method. */
export type TmplWriteOptions = {
  /** Flag indicating if the copy operation should be forced. (NB: "excluded" paths will never be written). */
  readonly force?: boolean;
  /** Flag indicating if the files should be written. Default: false. */
  readonly dryRun?: boolean;
  /** Optional context passed to the process-file handler. */
  readonly ctx?: O;
};

/**
 * The response returned from the `tmpl.copy` method.
 */
export type TmplWriteResult = {
  readonly dir: { readonly source: t.StringDir; readonly target: t.StringDir };
  readonly ops: readonly t.TmplWriteOp[];
  readonly ctx?: O;
};

/** Details about a template's file-write operation. */
export type TmplWriteOp = t.FileMapOp;

/**
 * Details about a file update.
 */
export type TmplFileOperation____ = TmplTextFileOperation | TmplBinaryFileOperation;
type Operation = {
  /** If excluded, contains the reason for the exclusion, otherwise `boolean` flag. */
  excluded: boolean | { reason: string };

  /** Flag indicating if a write operation was performed for the file. */
  written: boolean;

  /** Flag indicating if the write operation was a "create" action */
  created: boolean;

  /** Flag indicating if the write operation was the "update" action. */
  updated: boolean;

  /** Flag indicating if the file operation was forced. */
  forced: boolean;

  /** File path details. */
  file: { tmpl: t.FsFile; target: t.FsFile };
};

/** The content-type contained within the template file. */
export type TmplFileContentType = TmplFileOperation____['contentType'];

export type TmplTextFileOperation = Operation & {
  /** The content-type of the template file. */
  readonly contentType: 'text';
  readonly binary: undefined;

  /** The text content of the file. */
  readonly text: t.TmplFileOperationText;
};

export type TmplBinaryFileOperation = Operation & {
  /** The content-type of the template file. */
  readonly contentType: 'binary';
  readonly text: undefined;

  /** The binary content of the file. */
  readonly binary: t.TmplFileOperationBinary;
};

/** The text content of the file. */
export type TmplFileOperationText = {
  /** The source template before transform. */
  readonly tmpl: string;
  /** Details about the template file at the target location. */
  readonly target: { before: string; after: string; isDiff: boolean };
};

/** The binary content of the file. */
export type TmplFileOperationBinary = {
  /** The source template before transform. */
  readonly tmpl: Uint8Array;

  /** Details about the template file at the target location. */
  readonly target: { before: Uint8Array; after: Uint8Array; isDiff: boolean };
};
