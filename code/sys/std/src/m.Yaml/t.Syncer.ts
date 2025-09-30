import type { t } from './common.ts';

/**
 * Library namespace for the Yaml sync helpers:
 */
export type YamlSyncLib = {
  /** Creates a new parse-syncer. */
  make<T = unknown>(args: t.YamlSyncArgsInput): t.YamlSyncParser<T>;
};

/** Arguments passed to the `Yaml.Syncer.create` method. */
export type YamlSyncArgsInput = {
  doc: t.ImmutableRef | { source: t.ImmutableRef; target?: t.ImmutableRef };
  path: t.ObjectPath | { source: t.ObjectPath; target?: t.ObjectPath | null };
  dispose$?: t.UntilInput;
  debounce?: t.Msecs;
};

/** Normalized input arguments into usable values. */
export type YamlSyncArgs = {
  readonly life: t.Lifecycle;
  readonly doc: t.YamlSyncParserDocs;
  readonly path: t.YamlSyncParserPaths;
  readonly debounce: t.Msecs;
};

/**
 * Monitors an observable document and parses a YAML
 * string and persists it to a path on change.
 */
export type YamlSyncParser<T = unknown> = t.Lifecycle & {
  readonly ok: boolean;
  readonly $: t.Observable<t.YamlSyncParseResult<T>>;
  readonly path: YamlSyncParserPaths;
  readonly doc: YamlSyncParserDocs;
  readonly current: t.YamlSyncParseResult<T>;
  readonly errors: t.YamlError[];
};

/** Source and target docments being synced (may be the same document). */
export type YamlSyncParserDocs = {
  readonly source: t.ImmutableRef;
  readonly target: t.ImmutableRef;
};

/** Source and target paths. */
export type YamlSyncParserPaths = {
  readonly source: t.ObjectPath | null;
  readonly target: t.ObjectPath | null;
};

/** Change event fired by the sync-parser. */
export type YamlSyncParseResult<T = unknown> = {
  /** Returns true if no error is present and the error list is empty. */
  readonly ok: boolean;
  /** Monotonic revision counter */
  readonly rev: number;
  /** The parsed YAML output value. */
  readonly parsed?: YamlSyncParsed<T>;
  /** The diff operations. */
  readonly ops: t.ObjDiffOp[];
  /** The source/target paths used by the parser. */
  readonly path: t.YamlSyncParserPaths;
  /** The raw YAML text. */
  readonly text: { readonly before: t.StringYaml; readonly after: t.StringYaml };
  /** Stanard error (super set of parse errors). */
  readonly error?: t.StdError;
  /** The YAML parse errors, contains source-map pointers back into the raw YAML text.  */
  readonly errors: t.YamlError[];
};

/** A parsed YAML value. */
export type YamlSyncParsed<T> = T | t.YamPrimitive | undefined;
