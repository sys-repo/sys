import type { t } from './common.ts';

type O = Record<string, unknown>;

/**
 * Library for copying template files.
 */
export type TmplEngineLib = {
  /** Tools for converting a Tmpl to pretty log output. */
  readonly Log: t.TmplLogLib;

  /** Tools for modifying template files once written to the file-system. */
  readonly File: t.TmplFileLib;

  /** FileMap toolkit (bundling, validation, materialize). */
  readonly FileMap: t.FileMapLib;

  /** Create a new directory template. */
  makeTmpl: t.TmplFactory;

  /** Bundle a template to an embeddable JSON artefact. */
  bundle: t.FileMapLib['bundle'];
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
  readonly files: readonly t.StringPath[];
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
