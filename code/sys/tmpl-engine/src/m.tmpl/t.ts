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
  source: t.StringDir,
  options?: t.TmplFactoryOptions | t.TmplProcessFile,
) => t.Tmpl;

/** Options passed to the template engine factory. */
export type TmplFactoryOptions = {
  /** Handler to run after the write operation completes. */
  beforeWrite?: t.TmplWriteHandlerBefore;

  /** Handler to process each file in the template. */
  processFile?: t.TmplProcessFile;

  /** Handler to run after the write operation completes. */
  afterWrite?: t.TmplWriteHandlerAfter;

  /** Context data passed to the process handler. */
  ctx?: O;
};

/**
 * A template engine.
 */
export type Tmpl = {
  /** The directory containing the source template files. */
  readonly source: t.FsDir;

  /** Perform a copy of the templates to a target directory. */
  write(target: t.StringDir, options?: t.TmplWriteOptions): Promise<t.TmplWriteResponse>;

  /** Clones the template filtering down to a subset of source files. */
  filter(fn: t.TmplFilter): t.Tmpl;
};

/**
 * A filter on template source files.
 * NB: this differs from "exclude" whereby it filters out any knowledge of the
 *     file's existence in the source directory, however exclude acknowledges the
 *     existence of the file but excludes it from the set of templates that
 *     are copied to the target.
 */
export type TmplFilter = t.FsFileFilter;

/**
 * Handler that runs for each template file being copied.
 * Use this to:
 *  - filter out files (incl. marking as "user-space" exclusions)
 *  - adjust the text content before writing.
 *  - adjust the target filename.
 */
export type TmplProcessFile = (args: TmplProcessFileArgs) => TmplProcessFileResponse;
export type TmplProcessFileResponse = t.IgnoredResult | Promise<t.IgnoredResult>;
export type TmplProcessFileArgs = t.TmplProcessTextFileArgs | TmplProcessBinaryFileArgs;

type FileArgs = {
  /** Optional context passed to the `Tmpl.write` operation. */
  readonly ctx?: O;

  /** The source template file. */
  readonly tmpl: t.FsFile;

  /** The target location being copied to. */
  readonly target: t.FsFile & { exists: boolean };

  /** Filter out the file from being copied. */
  exclude(reason?: string): TmplProcessFileArgs;

  /** Adjust the name of the file. */
  rename(filename: string): TmplProcessFileArgs;

  /** Adjust the content of the file. */
  modify(next: string | Uint8Array): TmplProcessTextFileArgs;
};

/** Arguments passed to a text-file for processing. */
export type TmplProcessTextFileArgs = FileArgs & {
  /** The content-type of the template file. */
  readonly contentType: t.TmplTextFileOperation['contentType'];
  /** The text body of the file. */
  readonly text: { tmpl: string; current: string };
  readonly binary: undefined;
};

/** Arguments passed to a binary-file for processing. */
export type TmplProcessBinaryFileArgs = FileArgs & {
  /** The content-type of the template file. */
  readonly contentType: t.TmplBinaryFileOperation['contentType'];
  /** The text body of the file. */
  readonly binary: { tmpl: Uint8Array; current: Uint8Array };
  readonly text: undefined;
};

/**
 * Callback that is run after the template engine as finished copying.
 * Use this to do either clean up, or additional setup actions not handled
 * directly by the template-copy engine.
 */
export type TmplWriteHandler = (e: TmplWriteHandlerArgs) => t.IgnoredResult;
export type TmplWriteHandlerBefore = TmplWriteHandler;
export type TmplWriteHandlerAfter = TmplWriteHandler;
/** Arguments passed to the write handler. */
export type TmplWriteHandlerArgs = {
  readonly dir: { readonly source: t.FsDir; readonly target: t.FsDir };
  readonly ctx?: O;
};

/** Options passed to the `tmpl.copy` method. */
export type TmplWriteOptions = {
  /** Flag indicating if the copy operation should be forced. (NB: "excluded" paths will never be written). */
  force?: boolean;

  /** Flag indicating if the files should be written. Default: false. */
  dryRun?: boolean;

  /** Handler(s) to run before the copy operation starts. */
  beforeWrite?: t.TmplWriteHandler | t.TmplWriteHandler[];

  /** Handler(s) to run after the copy operation completes. */
  afterWrite?: t.TmplWriteHandler | t.TmplWriteHandler[];

  /** Context data passed to the process handler. */
  ctx?: O;
};

/**
 * The response returned from the `tmpl.copy` method.
 */
export type TmplWriteResponse = {
  readonly source: t.FsDir;
  readonly target: t.FsDir;
  readonly ops: t.TmplFileOperation[];
  readonly ctx?: O;
};

/**
 * Details about a file update.
 */
export type TmplFileOperation = TmplTextFileOperation | TmplBinaryFileOperation;
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
export type TmplFileContentType = TmplFileOperation['contentType'];

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
