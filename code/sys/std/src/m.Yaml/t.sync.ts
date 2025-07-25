import type { t } from './common.ts';

/**
 * Library namespace for the Yaml sync helpers:
 */
export type YamlSyncLib = Readonly<{
  /** Creates a new parse-syncer. */
  create<T = unknown>(args: t.YamlSyncArgsInput): t.YamlSyncParser<T>;
}>;

/** Arguments passed to the `Yaml.Syncer.create` method. */
export type YamlSyncArgsInput = {
  doc: t.ImmutableRef | { source: t.ImmutableRef; target?: t.ImmutableRef };
  path: t.ObjectPath | { source: t.ObjectPath; target?: t.ObjectPath | null };
  dispose$?: t.UntilInput;
  debounce?: t.Msecs;
};

/** Normalized input arguments into usable values. */
export type YamlSyncArgs = Readonly<{
  life: t.Lifecycle;
  doc: t.YamlSyncParserDocs;
  path: t.YamlSyncParserPaths;
  debounce: t.Msecs;
}>;

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
    yaml(): string | undefined;
    parsed(): YamSyncParsed<T>;
  };
  readonly errors: t.StdError[];
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
export type YamlSyncParserChange<T> = {
  readonly ops: t.ObjDiffOp[];
  readonly yaml: { before: string; after: string };
  readonly parsed?: YamSyncParsed<T>;
  readonly error?: t.StdError;
};

/** A parsed YAML value. */
export type YamSyncParsed<T> = T | t.YamPrimitives | undefined;
