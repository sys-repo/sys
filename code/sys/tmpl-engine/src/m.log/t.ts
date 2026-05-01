import type { t } from './common.ts';

type StringBaseDir = t.StringDir;

/**
 * Library for converting a Tmpl to console/log output.
 */
export type TmplLogLib = {
  /** Convert a set of template operations to a console table. */
  table(ops: readonly t.TmplWriteOp[], options?: t.TmplLogTableOptions | StringBaseDir): string;

  /** Prepare a bundled log message. */
  bundled(bundle: t.FileMapBundleResult): string;
};

/** Options passed to the `Tmpl.Log.table` method. */
export type TmplLogTableOptions = {
  /** Resolve relative op paths against this directory and trim output relative to it by default. */
  readonly baseDir?: StringBaseDir;
  /** Prefix each action label with spaces for nested log output. */
  readonly indent?: number;
  /** Hide skipped operations from the rendered table. */
  readonly hideSkipped?: boolean;
  /** Trim the displayed path relative to this directory. Defaults to `baseDir`. */
  readonly trimPathLeft?: t.StringPath;
  /** Prefix displayed relative paths, for example `./`; use `false` to suppress. */
  readonly relativePathPrefix?: string | false;
  /** Label actions as result words (`created`) or operation kinds (`create`). */
  readonly actionLabel?: 'result' | 'kind';
  /** Include the automatic `dry-run` note for dry-run operations. Defaults to true. */
  readonly showDryRunNote?: boolean;
  /** Append extra note text for each rendered operation. */
  readonly note?: (op: t.TmplWriteOp) => string | void;
};
