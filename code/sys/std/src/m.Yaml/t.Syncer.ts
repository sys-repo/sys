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
  readonly $: t.Observable<t.YamlSyncParserChange<T>>;
  readonly path: YamlSyncParserPaths;
  readonly doc: YamlSyncParserDocs;
  readonly current: {
    readonly input: string | undefined;
    readonly output: YamlSyncParsed<T>;
  };
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
export type YamlSyncParserChange<T = unknown> = {
  readonly ops: t.ObjDiffOp[];
  readonly yaml: { before: string; after: string };
  readonly parsed?: YamlSyncParsed<T>;
  readonly error?: t.StdError;
  readonly errors: t.YamlError[];
};

/** A parsed YAML value. */
export type YamlSyncParsed<T> = T | t.YamPrimitive | undefined;
