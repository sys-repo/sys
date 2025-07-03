import type { t } from './common.ts';

/**
 * Monitors an observable document and parses a YAML
 * string and persists it to a path on change.
 */
export type YamlSyncParser<T> = t.Lifecycle & {
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
  readonly yaml: { before: string; after: string };
  readonly parsed?: YamSyncParsed<T>;
  readonly error?: t.StdError;
};

/** A parsed YAML value. */
export type YamSyncParsed<T> = T | t.YamPrimitives | undefined;
